"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { formatAEDCompact } from "@/lib/money";
import { daysSince } from "@/lib/dates";
import { updateDealStage } from "@/server/deals";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, User as UserIcon } from "lucide-react";

const STAGES = [
  { key: "inquiry", label: "Inquiry", color: "bg-blue-500", grad: "from-blue-500 to-blue-600" },
  { key: "viewing", label: "Viewing", color: "bg-cyan-500", grad: "from-cyan-500 to-cyan-600" },
  { key: "negotiation", label: "Negotiation", color: "bg-amber-500", grad: "from-amber-500 to-amber-600" },
  { key: "offer", label: "Offer", color: "bg-purple-500", grad: "from-purple-500 to-purple-600" },
  { key: "contract", label: "Contract", color: "bg-indigo-500", grad: "from-indigo-500 to-indigo-600" },
  { key: "won", label: "Won", color: "bg-emerald-500", grad: "from-emerald-500 to-emerald-600" },
  { key: "lost", label: "Lost", color: "bg-red-500", grad: "from-red-500 to-red-600" },
] as const;

export type DealCard = {
  id: string;
  title: string;
  stage: string;
  value: number;
  customer: { id: string; name: string } | null;
  buyer_name: string | null;
  property_title: string | null;
  assigned_to: string | null;
  assigned_to_profile: { id: string; full_name: string; avatar_url: string | null } | null;
  stage_changed_at: string | null;
  lead_id: string | null;
};

function DealCardItem({ deal, isDragging }: { deal: DealCard; isDragging?: boolean }) {
  const days = deal.stage_changed_at ? daysSince(deal.stage_changed_at) : 0;
  const dayColor = days > 30 ? "text-destructive bg-destructive/10 border-destructive/20" : days > 14 ? "text-amber-700 bg-amber-100/80 border-amber-200/60" : "text-muted-foreground bg-muted border-border";

  return (
    <Link
      href={`/pipeline/${deal.id}`}
      className={`group block rounded-[12px] border border-border bg-card p-3 transition-all duration-200 ${isDragging ? "scale-[1.02] opacity-75 shadow-lg ring-2 ring-primary/40" : "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"}`}
    >
      <div className="flex items-start justify-between">
        <p className="line-clamp-1 flex-1 text-[15px] font-semibold text-foreground transition-colors group-hover:text-primary">
          {deal.title}
        </p>
      </div>
      {deal.customer ? (
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{deal.customer.name}</p>
      ) : deal.buyer_name ? (
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{deal.buyer_name}</p>
      ) : null}
      {deal.property_title && (
        <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">{deal.property_title}</p>
      )}

      <div className="my-3 border-t border-border" />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">{formatAEDCompact(deal.value)}</span>
          <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${dayColor}`}>
            {days}d
          </span>
        </div>
        
        {deal.assigned_to_profile && (
          <div className="flex items-center gap-2">
             {deal.assigned_to_profile.avatar_url ? (
               <img src={deal.assigned_to_profile.avatar_url} className="w-5 h-5 rounded-full object-cover" />
             ) : (
               <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                 <UserIcon className="h-3 w-3 text-slate-400" />
               </div>
             )}
            <span className="truncate text-xs font-medium text-muted-foreground">{deal.assigned_to_profile.full_name}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

function DraggableDeal({ deal }: { deal: DealCard }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
  });

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      <DealCardItem deal={deal} isDragging={isDragging} />
    </div>
  );
}

function DroppableColumn({
  stage,
  deals,
  onDrop,
}: {
  stage: { key: string; label: string; color: string; grad: string };
  deals: DealCard[];
  onDrop: (dealId: string, newStage: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });
  const total = deals.reduce((sum, d) => sum + (d.value ?? 0), 0);

  return (
    <div className="flex w-[240px] shrink-0 flex-col min-w-[240px]">
      <div className="mb-2 flex items-center justify-between rounded-t-[12px] border border-b-0 border-border bg-card px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${stage.color}`} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{stage.label}</h3>
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
            {deals.length}
          </span>
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground">{formatAEDCompact(total)}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`scrollbar-gold min-h-[500px] flex-1 space-y-2 rounded-b-[12px] border border-border p-2 transition-colors ${isOver ? "bg-primary/5" : "bg-muted/20"}`}
      >
        {deals.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {isOver ? "Drop here" : "Empty"}
          </div>
        ) : (
          deals.map((deal) => <DraggableDeal key={deal.id} deal={deal} />)
        )}
      </div>
    </div>
  );
}

export function PipelineBoard({
  deals,
  userRole,
  userId,
}: {
  deals: DealCard[];
  userRole: string;
  userId: string;
}) {
  const [activeDeal, setActiveDeal] = useState<DealCard | null>(null);
  const [wonDialog, setWonDialog] = useState<DealCard | null>(null);
  const [lostDialog, setLostDialog] = useState<DealCard | null>(null);
  const [wonValue, setWonValue] = useState("");
  const [wonCommission, setWonCommission] = useState("");
  const [lostReason, setLostReason] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragStart(e: DragStartEvent) {
    const deal = deals.find((d) => d.id === e.active.id);
    if (deal) setActiveDeal(deal);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveDeal(null);
    if (!e.over) return;

    const dealId = e.active.id as string;
    const newStage = e.over.id as string;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === newStage) return;

    // Agents can only move their own deals
    if (userRole === "agent" && deal.assigned_to !== userId) {
      toast.error("You can only move your own deals");
      return;
    }

    if (newStage === "won") {
      setWonValue(String((deal.value ?? 0) / 100));
      setWonDialog(deal);
      return;
    }

    if (newStage === "lost") {
      setLostDialog(deal);
      return;
    }

    // Optimistic: move immediately
    startTransition(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await updateDealStage({ id: dealId, stage: newStage as any });
      if (result.ok) {
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update deal");
      }
    });
  }

  function confirmWon() {
    if (!wonDialog) return;
    startTransition(async () => {
      const result = await updateDealStage({
        id: wonDialog.id,
        stage: "won",
        value: wonValue ? Number(wonValue) : undefined,
        commission_amount: wonCommission ? Number(wonCommission) : undefined,
      });
      if (result.ok) {
        toast.success("Deal moved to Won!");
        setWonDialog(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function confirmLost() {
    if (!lostDialog || !lostReason.trim()) {
      toast.error("Lost reason is required");
      return;
    }
    startTransition(async () => {
      const result = await updateDealStage({
        id: lostDialog.id,
        stage: "lost",
        lost_reason: lostReason,
      });
      if (result.ok) {
        toast.success("Deal marked as Lost");
        setLostDialog(null);
        setLostReason("");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  // Group deals by stage
  const dealsByStage = STAGES.reduce(
    (acc, stage) => {
      acc[stage.key] = deals.filter((d) => d.stage === stage.key);
      return acc;
    },
    {} as Record<string, DealCard[]>
  );

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="scrollbar-gold flex gap-3 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <DroppableColumn
              key={stage.key}
              stage={stage}
              deals={dealsByStage[stage.key] ?? []}
              onDrop={() => {}}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal ? <DealCardItem deal={activeDeal} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {/* Won dialog */}
      <Dialog open={!!wonDialog} onOpenChange={(v) => !v && setWonDialog(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border-0 p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-white">Deal Won!</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-emerald-100 mt-1">{wonDialog?.title}</p>
          </div>
          <div className="p-4 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Final Deal Value (AED)</Label>
              <Input
                type="number"
                value={wonValue}
                onChange={(e) => setWonValue(e.target.value)}
                placeholder="Deal value"
                className="rounded-xl border-slate-200/60 bg-slate-50/50 focus:bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Commission Amount (AED)</Label>
              <Input
                type="number"
                value={wonCommission}
                onChange={(e) => setWonCommission(e.target.value)}
                placeholder="Commission"
                className="rounded-xl border-slate-200/60 bg-slate-50/50 focus:bg-white"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" className="rounded-xl font-bold hover:bg-slate-100" onClick={() => setWonDialog(null)}>
                Cancel
              </Button>
              <Button className="rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold" onClick={confirmWon} disabled={pending}>
                Confirm Win 🚀
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lost dialog */}
      <Dialog open={!!lostDialog} onOpenChange={(v) => !v && setLostDialog(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border-0 p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-white">Deal Lost</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-red-100 mt-1">{lostDialog?.title}</p>
          </div>
          <div className="p-4 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Reason for Loss *</Label>
              <Textarea
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                placeholder="Why was this deal lost?"
                rows={3}
                className="rounded-xl border-slate-200/60 bg-slate-50/50 focus:bg-white resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" className="rounded-xl font-bold hover:bg-slate-100" onClick={() => setLostDialog(null)}>
                Cancel
              </Button>
              <Button variant="destructive" className="rounded-xl font-bold" onClick={confirmLost} disabled={pending || !lostReason.trim()}>
                Confirm Loss
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

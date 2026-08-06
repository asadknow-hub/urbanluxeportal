"use client";

import { useState, useTransition } from "react";
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
import { ExternalLink } from "lucide-react";

const STAGES = [
  { key: "inquiry", label: "Inquiry", color: "bg-blue-500" },
  { key: "viewing", label: "Viewing", color: "bg-cyan-500" },
  { key: "negotiation", label: "Negotiation", color: "bg-amber-500" },
  { key: "offer", label: "Offer", color: "bg-purple-500" },
  { key: "contract", label: "Contract", color: "bg-indigo-500" },
  { key: "won", label: "Won", color: "bg-emerald-500" },
  { key: "lost", label: "Lost", color: "bg-red-500" },
] as const;

export type DealCard = {
  id: string;
  title: string;
  stage: string;
  value: number;
  customer: { id: string; name: string } | null;
  assigned_to: string | null;
  assigned_to_profile: { id: string; full_name: string; avatar_url: string | null } | null;
  stage_changed_at: string | null;
  property_id: string | null;
  lead_id: string | null;
};

function DealCardItem({ deal, isDragging }: { deal: DealCard; isDragging?: boolean }) {
  const days = deal.stage_changed_at ? daysSince(deal.stage_changed_at) : 0;
  const dayColor = days > 30 ? "text-red-600 bg-red-50" : days > 14 ? "text-amber-600 bg-amber-50" : "text-slate-500 bg-slate-50";

  return (
    <Link
      href={`/pipeline/${deal.id}`}
      className={`block rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow ${isDragging ? "shadow-lg opacity-75" : "hover:shadow-md"}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-900 line-clamp-1 flex-1">{deal.title}</p>
        <ExternalLink className="h-3 w-3 text-slate-300 flex-shrink-0 ml-1" />
      </div>
      {deal.customer && (
        <p className="text-xs text-slate-500 mt-0.5">{deal.customer.name}</p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{formatAEDCompact(deal.value)}</span>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${dayColor}`}>
          {days}d
        </span>
      </div>
      {deal.assigned_to_profile && (
        <p className="mt-1.5 text-xs text-slate-400">{deal.assigned_to_profile.full_name}</p>
      )}
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
  stage: { key: string; label: string; color: string };
  deals: DealCard[];
  onDrop: (dealId: string, newStage: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });
  const total = deals.reduce((sum, d) => sum + (d.value ?? 0), 0);

  return (
    <div className="flex flex-col min-w-[220px] w-72">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
          <h3 className="text-sm font-semibold text-slate-700">{stage.label}</h3>
          <span className="text-xs text-slate-400">({deals.length})</span>
        </div>
        <span className="text-xs font-medium text-slate-500">{formatAEDCompact(total)}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 rounded-xl p-2 min-h-[200px] transition-colors ${isOver ? "bg-emerald-50 border-2 border-dashed border-emerald-300" : "bg-slate-50/50"}`}
      >
        {deals.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-slate-300">
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
      const result = await updateDealStage({ id: dealId, stage: newStage as any });
      if (!result.ok) toast.error(result.error ?? "Failed to update deal");
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
        <div className="flex gap-4 overflow-x-auto pb-4">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Won — {wonDialog?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Deal Value (AED)</Label>
              <Input
                type="number"
                value={wonValue}
                onChange={(e) => setWonValue(e.target.value)}
                placeholder="Deal value"
              />
            </div>
            <div className="space-y-2">
              <Label>Commission Amount (AED)</Label>
              <Input
                type="number"
                value={wonCommission}
                onChange={(e) => setWonCommission(e.target.value)}
                placeholder="Commission"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setWonDialog(null)}>
                Cancel
              </Button>
              <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={confirmWon} disabled={pending}>
                Confirm Won
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lost dialog */}
      <Dialog open={!!lostDialog} onOpenChange={(v) => !v && setLostDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Lost — {lostDialog?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Lost Reason *</Label>
              <Textarea
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                placeholder="Why was this deal lost?"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLostDialog(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmLost} disabled={pending || !lostReason.trim()}>
                Confirm Lost
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

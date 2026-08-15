"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { AlertCircle, MoreHorizontal, Plus, Edit3, Trash2, User as UserIcon } from "lucide-react";
import { updateLeadStage, createLeadStage, updateLeadStageName, deleteLeadStage } from "@/server/leads";
import { cn } from "@/lib/utils";
import { formatLeadInterest, formatLeadTag } from "@/lib/lead-format";
import { formatAEDRange } from "@/lib/money";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type LeadStage = {
  id: string;
  name: string;
  color: string;
  kind: string;
  sort: number;
  stale_after_days: number | null;
  required_fields: unknown[];
  helper_text: string | null;
};

export type BoardLead = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  interest: string | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_areas: string[] | null;
  stage_id: string | null;
  assigned_to: string | null;
  next_follow_up_at: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
  tags: string[];
  assigned_to_profile: { id: string; full_name: string; avatar_url: string | null } | null;
  duplicate?: boolean;
};

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; dot: string; grad: string }> = {
  blue: { bg: "bg-blue-50/80", border: "border-blue-200/60", text: "text-blue-700", dot: "bg-blue-500", grad: "from-blue-50/80 to-transparent" },
  cyan: { bg: "bg-cyan-50/80", border: "border-cyan-200/60", text: "text-cyan-700", dot: "bg-cyan-500", grad: "from-cyan-50/80 to-transparent" },
  teal: { bg: "bg-teal-50/80", border: "border-teal-200/60", text: "text-teal-700", dot: "bg-teal-500", grad: "from-teal-50/80 to-transparent" },
  purple: { bg: "bg-purple-50/80", border: "border-purple-200/60", text: "text-purple-700", dot: "bg-purple-500", grad: "from-purple-50/80 to-transparent" },
  indigo: { bg: "bg-indigo-50/80", border: "border-indigo-200/60", text: "text-indigo-700", dot: "bg-indigo-500", grad: "from-indigo-50/80 to-transparent" },
  green: { bg: "bg-emerald-50/80", border: "border-emerald-200/60", text: "text-emerald-700", dot: "bg-emerald-500", grad: "from-emerald-50/80 to-transparent" },
  slate: { bg: "bg-slate-100/80", border: "border-slate-300/60", text: "text-slate-700", dot: "bg-slate-500", grad: "from-slate-100/80 to-transparent" },
  gray: { bg: "bg-gray-100/80", border: "border-gray-300/60", text: "text-gray-700", dot: "bg-gray-500", grad: "from-gray-100/80 to-transparent" },
  amber: { bg: "bg-amber-50/80", border: "border-amber-200/60", text: "text-amber-700", dot: "bg-amber-500", grad: "from-amber-50/80 to-transparent" },
  red: { bg: "bg-red-50/80", border: "border-red-200/60", text: "text-red-700", dot: "bg-red-500", grad: "from-red-50/80 to-transparent" },
};

function getColor(color: string) {
  return COLOR_MAP[color] ?? COLOR_MAP.blue;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function isStale(lead: BoardLead, stage: LeadStage): boolean {
  if (!stage.stale_after_days) return false;
  const ref = lead.last_activity_at ?? lead.updated_at;
  const diff = (Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24);
  return diff > stage.stale_after_days;
}

function LeadCard({ lead, stage, isDragging }: { lead: BoardLead; stage: LeadStage; isDragging?: boolean }) {
  const stale = isStale(lead, stage);
  const budget = formatAEDRange(lead.budget_min, lead.budget_max);
  const area = lead.preferred_areas?.[0];
  const extraAreas = (lead.preferred_areas?.length ?? 0) - 1;
  const interestLabel = lead.interest ? formatLeadInterest(lead.interest) : null;
  const tags = (lead.tags ?? []).filter((tag) => tag.toLowerCase() !== (lead.interest ?? "").toLowerCase()).slice(0, 1);

  return (
    <div
      className={cn(
        "cursor-grab rounded-lg border border-border bg-card px-2.5 py-2 active:cursor-grabbing",
        isDragging && "opacity-50 ring-1 ring-primary/40",
        stale && "border-amber-300/80"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/leads/${lead.id}`}
          className="min-w-0 text-[13px] font-medium leading-tight text-foreground hover:text-primary"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="line-clamp-1">{lead.name}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          {lead.duplicate && (
            <span className="rounded bg-red-50 px-1 py-px text-[10px] font-medium text-red-700">Dup</span>
          )}
          {stale && <AlertCircle className="h-3.5 w-3.5 text-amber-500" />}
        </div>
      </div>

      {(interestLabel || budget) && (
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {[interestLabel, budget].filter(Boolean).join(" · ")}
        </p>
      )}
      {area && (
        <p className="truncate text-[11px] text-muted-foreground">
          {area}
          {extraAreas > 0 ? ` +${extraAreas}` : ""}
        </p>
      )}
      {tags.length > 0 && (
        <p className="truncate text-[11px] text-muted-foreground">{formatLeadTag(tags[0])}</p>
      )}

      <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1 truncate">
          {lead.assigned_to_profile ? (
            <>
              {lead.assigned_to_profile.avatar_url ? (
                <img src={lead.assigned_to_profile.avatar_url} className="h-4 w-4 rounded-full object-cover" alt="" />
              ) : (
                <UserIcon className="h-3 w-3 shrink-0" />
              )}
              <span className="truncate">{lead.assigned_to_profile.full_name.split(" ")[0]}</span>
            </>
          ) : (
            <span>Unassigned</span>
          )}
        </span>
        <span className="shrink-0 tabular-nums" suppressHydrationWarning>
          {lead.next_follow_up_at ? (
            new Date(lead.next_follow_up_at).toLocaleDateString("en", { month: "short", day: "numeric" })
          ) : (
            timeAgo(lead.last_activity_at ?? lead.updated_at)
          )}
        </span>
      </div>
    </div>
  );
}

function DraggableLeadCard({ lead, stage }: { lead: BoardLead; stage: LeadStage }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
    data: { lead, stageId: stage.id },
  });
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only navigate if it wasn't a drag (small movement threshold)
    if (!dragStartPos.current) return;
    const dx = Math.abs(e.clientX - dragStartPos.current.x);
    const dy = Math.abs(e.clientY - dragStartPos.current.y);
    if (dx < 5 && dy < 5 && !isDragging) {
      router.push(`/leads/${lead.id}`);
    }
    dragStartPos.current = null;
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onPointerDown={(e) => {
        listeners?.onPointerDown?.(e);
        handlePointerDown(e);
      }}
      onClick={handleClick}
    >
      <LeadCard lead={lead} stage={stage} isDragging={isDragging} />
    </div>
  );
}

function StageColumn({
  stage,
  leads,
}: {
  stage: LeadStage;
  leads: BoardLead[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const color = getColor(stage.color);
  
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newName, setNewName] = useState(stage.name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleRename = async () => {
    if (!newName.trim() || newName === stage.name) {
      setRenameOpen(false);
      return;
    }
    setIsSubmitting(true);
    const res = await updateLeadStageName(stage.id, newName);
    setIsSubmitting(false);
    if (res.ok) {
      toast.success("Stage renamed successfully");
      setRenameOpen(false);
      router.refresh();
    } else {
      toast.error(res.error || "Failed to rename stage");
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    const res = await deleteLeadStage(stage.id);
    setIsSubmitting(false);
    if (res.ok) {
      toast.success("Stage deleted successfully");
      setDeleteOpen(false);
      router.refresh();
    } else {
      toast.error(res.error || "Failed to delete stage");
    }
  };

  const isSystemStage = ["won", "lost", "junk"].includes(stage.kind);

  return (
    <div className="flex h-full w-[240px] min-w-[240px] flex-col">
      <div
        className={cn("flex items-center justify-between gap-1 border-t-2 bg-card px-2 py-1.5", color.border)}
        title={stage.helper_text ?? undefined}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={cn("h-2 w-2 shrink-0 rounded-full", color.dot)} />
          <h3 className="truncate text-xs font-medium text-foreground">{stage.name}</h3>
        </div>
        <div className="flex shrink-0 items-center">
          <span className="px-1 text-[11px] tabular-nums text-muted-foreground">{leads.length}</span>
          <DropdownMenu>
            <DropdownMenuTrigger render={<button className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted" aria-label={`${stage.name} options`} />}>
              <MoreHorizontal className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => { setNewName(stage.name); setRenameOpen(true); }} disabled={isSystemStage}>
                  <Edit3 className="mr-2 h-4 w-4" /> Rename Stage
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setDeleteOpen(true)} className="text-red-600" disabled={isSystemStage || leads.length > 0}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Stage
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "scrollbar-gold flex-1 space-y-1.5 overflow-y-auto border border-t-0 border-border bg-muted/25 p-1.5",
          isOver && "bg-muted ring-1 ring-inset ring-primary/30"
        )}
      >
        {leads.length === 0 && (
          <div className="flex h-16 items-center justify-center text-[11px] text-muted-foreground">
            Drop here
          </div>
        )}
        {leads.map((lead) => (
          <DraggableLeadCard key={lead.id} lead={lead} stage={stage} />
        ))}
      </div>
      
      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Stage</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Stage Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus placeholder="e.g. Follow Up" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button onClick={handleRename} disabled={!newName.trim() || isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Stage</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the stage <strong>{stage.name}</strong>? This action cannot be undone.
            </p>
            {leads.length > 0 && (
              <p className="text-sm text-red-600 font-medium mt-2">
                This stage contains {leads.length} leads. You must move them to another stage before deleting.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={leads.length > 0 || isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete Stage"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function LeadsBoard({
  stages,
  leads,
  duplicateLeadIds = [],
}: {
  stages: LeadStage[];
  leads: BoardLead[];
  duplicateLeadIds?: string[];
  userRole: string;
}) {
  const router = useRouter();
  const [activeLead, setActiveLead] = useState<{ lead: BoardLead; stage: LeadStage } | null>(null);
  const [optimisticLeads, setOptimisticLeads] = useState(leads);
  
  const [addStageOpen, setAddStageOpen] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState("blue");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const duplicateSet = useMemo(() => new Set(duplicateLeadIds), [duplicateLeadIds]);

  // Group leads by stage
  const leadsByStage = useMemo(() => {
    const map: Record<string, BoardLead[]> = {};
    for (const stage of stages) {
      map[stage.id] = [];
    }
    for (const lead of optimisticLeads) {
      if (lead.stage_id && map[lead.stage_id]) {
        map[lead.stage_id].push(lead);
      }
    }
    // Sort each column by updated_at desc
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
    return map;
  }, [optimisticLeads, stages]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as { lead: BoardLead; stageId: string } | undefined;
    if (data) {
      const stage = stages.find((s) => s.id === data.stageId);
      if (stage) setActiveLead({ lead: data.lead, stage });
    }
  }, [stages]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);

    if (!over) return;

    const leadId = active.id as string;
    const targetStageId = over.id as string;

    // Find the lead and its current stage
    const lead = optimisticLeads.find((l) => l.id === leadId);
    if (!lead) return;
    if (lead.stage_id === targetStageId) return; // no change

    // Optimistic update
    setOptimisticLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage_id: targetStageId } : l))
    );

    // Server action
    const result = await updateLeadStage(leadId, targetStageId);
    if (result.ok) {
      router.refresh();
    } else {
      // Revert on failure
      setOptimisticLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, stage_id: lead.stage_id } : l))
      );
      toast.error(result.error ?? "Failed to move lead");
    }
  }, [optimisticLeads, router]);
  
  const handleCreateStage = async () => {
    if (!newStageName.trim()) return;
    setIsSubmitting(true);
    const res = await createLeadStage(newStageName, newStageColor);
    setIsSubmitting(false);
    if (res.ok) {
      toast.success("Stage created successfully");
      setAddStageOpen(false);
      setNewStageName("");
      router.refresh();
    } else {
      toast.error(res.error || "Failed to create stage");
    }
  };

  return (
    <>
      <DndContext
        id="leads-board"
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="scrollbar-gold flex h-[calc(100dvh-7.5rem)] gap-2 overflow-x-auto">
          {stages.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              leads={(leadsByStage[stage.id] ?? []).map((lead) => ({
                ...lead,
                tags: lead.tags ?? [],
                duplicate: duplicateSet.has(lead.id),
              }))}
            />
          ))}
          
          <div className="flex h-full w-10 shrink-0 flex-col py-1">
            <button 
              type="button"
              onClick={() => setAddStageOpen(true)}
              className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
              aria-label="Add stage"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <DragOverlay>
          {activeLead ? (
            <div className="rotate-3 opacity-90">
              <LeadCard lead={activeLead.lead} stage={activeLead.stage} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      
      {/* Create Stage Dialog */}
      <Dialog open={addStageOpen} onOpenChange={setAddStageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Stage</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-5">
            <div className="space-y-2">
              <Label>Stage Name</Label>
              <Input 
                value={newStageName} 
                onChange={(e) => setNewStageName(e.target.value)} 
                placeholder="e.g. Negotiation" 
                autoFocus 
              />
            </div>
            <div className="space-y-3">
              <Label>Stage Color</Label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(COLOR_MAP).map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewStageColor(color)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                      COLOR_MAP[color].bg,
                      newStageColor === color ? "border-slate-900 ring-2 ring-slate-900 ring-offset-2" : "border-transparent"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStageOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateStage} disabled={!newStageName.trim() || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Stage"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useState, useCallback, useMemo } from "react";
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
import { Phone, Mail, Clock, User as UserIcon, AlertCircle } from "lucide-react";
import { updateLeadStage } from "@/server/leads";
import { cn } from "@/lib/utils";

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
};

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  cyan: { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700", dot: "bg-cyan-500" },
  teal: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", dot: "bg-teal-500" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", dot: "bg-purple-500" },
  indigo: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", dot: "bg-indigo-500" },
  green: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  slate: { bg: "bg-slate-100", border: "border-slate-300", text: "text-slate-600", dot: "bg-slate-400" },
  gray: { bg: "bg-gray-100", border: "border-gray-300", text: "text-gray-600", dot: "bg-gray-400" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500" },
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
  const color = getColor(stage.color);
  const stale = isStale(lead, stage);

  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-3 shadow-sm transition-all hover:shadow-md cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50",
        stale && "ring-1 ring-amber-300"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/leads/${lead.id}`}
          className="text-sm font-semibold text-slate-900 hover:underline truncate"
          onClick={(e) => e.stopPropagation()}
        >
          {lead.name}
        </Link>
        {stale && (
          <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        )}
      </div>

      <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
        {lead.interest && (
          <span className={cn("rounded px-1.5 py-0.5 font-medium", color.bg, color.text)}>
            {lead.interest}
          </span>
        )}
        {lead.assigned_to_profile ? (
          <span className="flex items-center gap-1 truncate">
            <UserIcon className="h-3 w-3" />
            {lead.assigned_to_profile.full_name}
          </span>
        ) : (
          <span className="text-slate-400 italic">Unassigned</span>
        )}
      </div>

      {(lead.budget_min || lead.budget_max) && (
        <p className="mt-1 text-xs text-slate-500">
          {lead.budget_min ? `${(lead.budget_min / 100).toLocaleString()}k` : "?"}
          {" – "}
          {lead.budget_max ? `${(lead.budget_max / 100).toLocaleString()}k` : "?"} AED
        </p>
      )}

      {lead.preferred_areas && lead.preferred_areas.length > 0 && (
        <p className="mt-0.5 text-xs text-slate-400 truncate">
          {lead.preferred_areas.slice(0, 2).join(", ")}
          {lead.preferred_areas.length > 2 && ` +${lead.preferred_areas.length - 2}`}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeAgo(lead.last_activity_at ?? lead.updated_at)}
        </span>
        {lead.next_follow_up_at && (
          <span className="text-amber-600 font-medium">
            {new Date(lead.next_follow_up_at).toLocaleDateString("en", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </div>
  );
}

function DraggableLeadCard({ lead, stage }: { lead: BoardLead; stage: LeadStage }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
    data: { lead, stageId: stage.id },
  });

  return (
    <div ref={setNodeRef} {...attributes} {...listeners}>
      <LeadCard lead={lead} stage={stage} isDragging={isDragging} />
    </div>
  );
}

function StageColumn({
  stage,
  leads,
  onDrop,
}: {
  stage: LeadStage;
  leads: BoardLead[];
  onDrop: (leadId: string, stageId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const color = getColor(stage.color);

  return (
    <div className="flex h-full flex-col min-w-[260px] w-[280px]">
      <div className={cn("rounded-t-lg border-t-4 px-3 py-2", color.border, color.bg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", color.dot)} />
            <h3 className="text-sm font-semibold text-slate-700">{stage.name}</h3>
          </div>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 border border-slate-200">
            {leads.length}
          </span>
        </div>
        {stage.helper_text && (
          <p className="mt-0.5 text-xs text-slate-400 truncate">{stage.helper_text}</p>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 overflow-y-auto rounded-b-lg border border-t-0 bg-slate-50/50 p-2 space-y-2 min-h-[200px] transition-colors",
          color.border,
          isOver && "bg-slate-100 ring-2 ring-inset ring-slate-300"
        )}
      >
        {leads.length === 0 && (
          <div className="flex h-32 items-center justify-center text-xs text-slate-300">
            Drop leads here
          </div>
        )}
        {leads.map((lead) => (
          <DraggableLeadCard key={lead.id} lead={lead} stage={stage} />
        ))}
      </div>
    </div>
  );
}

export function LeadsBoard({
  stages,
  leads,
  userRole,
}: {
  stages: LeadStage[];
  leads: BoardLead[];
  userRole: string;
}) {
  const router = useRouter();
  const [activeLead, setActiveLead] = useState<{ lead: BoardLead; stage: LeadStage } | null>(null);
  const [optimisticLeads, setOptimisticLeads] = useState(leads);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 h-[calc(100vh-12rem)]">
        {stages.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            leads={leadsByStage[stage.id] ?? []}
            onDrop={() => {}}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? (
          <div className="rotate-3 opacity-90">
            <LeadCard lead={activeLead.lead} stage={activeLead.stage} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

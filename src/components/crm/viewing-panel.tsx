"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { propertyLabel, VIEWING_OUTCOMES, VIEWING_STATUSES } from "@/lib/inventory";
import { formatDateTime } from "@/lib/dates";
import { scheduleViewing, updateViewingOutcome } from "@/server/viewings";
import { toast } from "sonner";
import { CalendarClock, Loader2 } from "lucide-react";

export type InventoryChoice = {
  id: string;
  property_code: string;
  community: string | null;
  building_name: string | null;
  unit_number: string | null;
  property_type: string;
  bedrooms: number | null;
};

export type ViewingRow = {
  id: string;
  scheduled_at: string;
  status: string;
  outcome: string | null;
  note: string | null;
  outcome_note: string | null;
  agent_id: string | null;
  property_id: string | null;
  property?: InventoryChoice | InventoryChoice[] | null;
  agent?: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
};

function toDatetimeLocal(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  if (!iso) d.setMinutes(d.getMinutes() + 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ViewingPanel({
  leadId,
  dealId,
  viewings,
  properties,
  agents,
  defaultAgentId,
  canEdit,
}: {
  leadId?: string | null;
  dealId?: string | null;
  viewings: ViewingRow[];
  properties: InventoryChoice[];
  agents: { id: string; full_name: string }[];
  defaultAgentId?: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(toDatetimeLocal());
  const [propertyId, setPropertyId] = useState<string>("");
  const [agentId, setAgentId] = useState(defaultAgentId ?? "");
  const [note, setNote] = useState("");

  const upcoming = useMemo(
    () => viewings.filter((row) => row.status === "scheduled"),
    [viewings]
  );

  function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await scheduleViewing({
        lead_id: leadId || null,
        deal_id: dealId || null,
        property_id: propertyId || null,
        scheduled_at: scheduledAt,
        agent_id: agentId || null,
        note: note || null,
      });
      if (result.ok) {
        toast.success("Viewing booked");
        setOpen(false);
        setNote("");
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not book viewing");
      }
    });
  }

  function handleOutcome(id: string, status: "completed" | "no_show" | "cancelled", outcome?: string) {
    startTransition(async () => {
      const result = await updateViewingOutcome({ id, status, outcome: outcome || null });
      if (result.ok) {
        toast.success("Viewing updated");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  return (
    <section className="rounded-[14px] border border-border bg-card px-[26px] py-6">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="font-heading text-[1.12rem]" style={{ fontFamily: "var(--font-display), serif" }}>
            Viewings
          </h2>
          <p className="mt-0.5 text-[0.8rem] text-muted-foreground">
            {upcoming.length} upcoming · {viewings.length} total
          </p>
        </div>
        {canEdit ? (
          <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
            <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
            Book
          </Button>
        ) : null}
      </div>

      {open && canEdit ? (
        <form onSubmit={handleSchedule} className="mb-4 space-y-3 rounded-[12px] border border-border bg-muted/30 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>When</Label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Agent</Label>
              <Select value={agentId || "none"} onValueChange={(v) => setAgentId(v === "none" ? "" : v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Unit</Label>
            <Select value={propertyId || "none"} onValueChange={(v) => setPropertyId(v === "none" ? "" : v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Optional inventory unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No unit yet</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {propertyLabel(property)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[0.72rem] text-muted-foreground">
              Add units in{" "}
              <Link href="/inventory" className="underline hover:text-foreground">
                Inventory
              </Link>{" "}
              first if the list is empty.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Note</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Meeting point, gate, etc." />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save viewing"}
            </Button>
          </div>
        </form>
      ) : null}

      {viewings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No viewings booked yet.</p>
      ) : (
        <div className="space-y-3">
          {viewings.map((row) => (
            <div key={row.id} className="rounded-[12px] border border-border/70 px-3 py-2.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{formatDateTime(row.scheduled_at)}</p>
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      const unit = Array.isArray(row.property) ? row.property[0] : row.property;
                      const agent = Array.isArray(row.agent) ? row.agent[0] : row.agent;
                      return `${unit ? propertyLabel(unit) : "Unit not linked"}${agent?.full_name ? ` · ${agent.full_name}` : ""}`;
                    })()}
                  </p>
                  {row.note ? <p className="mt-1 text-xs text-muted-foreground">{row.note}</p> : null}
                </div>
                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {VIEWING_STATUSES.find((s) => s.value === row.status)?.label ?? row.status}
                </span>
              </div>
              {canEdit && row.status === "scheduled" ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {VIEWING_OUTCOMES.map((outcome) => (
                    <Button
                      key={outcome.value}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px]"
                      disabled={pending}
                      onClick={() => handleOutcome(row.id, "completed", outcome.value)}
                    >
                      {outcome.label}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[11px] text-amber-800"
                    disabled={pending}
                    onClick={() => handleOutcome(row.id, "no_show")}
                  >
                    No-show
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[11px] text-red-700"
                    disabled={pending}
                    onClick={() => handleOutcome(row.id, "cancelled")}
                  >
                    Cancel
                  </Button>
                </div>
              ) : null}
              {row.outcome && row.status !== "scheduled" ? (
                <p className="mt-1 text-xs capitalize text-muted-foreground">
                  Outcome: {row.outcome.replace(/_/g, " ")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

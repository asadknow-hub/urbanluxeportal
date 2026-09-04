import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  LeadsBoard,
  type BoardLead,
  type BoardLeadQueryRow,
  type LeadStage,
} from "@/components/leads/leads-board";
import { LeadsTable, type LeadRow } from "@/components/leads/leads-table";
import { LeadCreateDialog } from "@/components/leads/lead-create-dialog";
import { LeadsAgentFilter } from "@/components/leads/leads-agent-filter";
import Link from "next/link";
import { KanbanSquare, List, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { groupLeadFieldOptions, type LeadFieldOption } from "@/lib/lead-field-options";
import { agentLeadScopeOr, ilikeOrFilter } from "@/lib/postgrest-filter";
import { sweepFirstResponseSla } from "@/server/first-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LIST_PAGE_SIZE = 50;
const BOARD_LIMIT_DEFAULT = 200;
const BOARD_LIMIT_STEP = 200;
const BOARD_LIMIT_MAX = 1000;

/** Columns the list UI actually renders — no notes / nationality / call dumps. */
const LIST_SELECT = `
  id, name, phone, email, source, interest, budget_min, budget_max, status, score,
  next_follow_up_at, assigned_to, created_at, stage_id,
  first_response_due_at, first_responded_at, first_response_minutes,
  assigned_to_profile:profiles!leads_assigned_to_fkey(id, full_name, avatar_url)
`.replace(/\s+/g, " ").trim();

/** Board card fields + phone/email for server-side dup calc only. */
const BOARD_SELECT = `
  id, name, phone, email, interest, budget_min, budget_max, preferred_areas,
  stage_id, assigned_to, customer_id, next_follow_up_at, created_at, updated_at,
  last_activity_at, stage_entered_at, tags,
  first_response_due_at, first_responded_at, first_response_minutes,
  assigned_to_profile:profiles!leads_assigned_to_fkey(id, full_name, avatar_url)
`.replace(/\s+/g, " ").trim();

function stripBoardContactFields(row: BoardLeadQueryRow): BoardLead {
  const { phone: _phone, email: _email, ...lead } = row;
  return lead;
}

export default async function LeadsBoardPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    source?: string;
    assigned?: string;
    q?: string;
    stage?: string;
    page?: string;
    board_limit?: string;
    sla?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;
  const view = params.view === "list" ? "list" : "board";
  await sweepFirstResponseSla();

  const applySlaFilter = <T extends { is: (col: string, val: null) => T; not: (col: string, op: string, val: null) => T; lt: (col: string, val: string) => T }>(
    query: T
  ) => {
    if (params.sla !== "first_response_overdue") return query;
    const nowIso = new Date().toISOString();
    return query.is("first_responded_at", null).not("first_response_due_at", "is", null).lt("first_response_due_at", nowIso);
  };

  const buildViewHref = (nextView: "board" | "list") => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (!value || key === "view") continue;
      query.set(key, value);
    }
    query.set("view", nextView);
    return `/leads?${query.toString()}`;
  };

  const applyAgentScope = <T extends { or: (filters: string) => T }>(query: T) => {
    if (user.role !== "agent") return query;
    return query.or(agentLeadScopeOr(user.id, user.team_id));
  };

  const applySearch = <T extends { or: (filters: string) => T }>(query: T) => {
    const filter = ilikeOrFilter(["name", "phone", "email"], params.q);
    return filter ? query.or(filter) : query;
  };

  const fetchBoardData = async () => {
    const boardLimit = Math.min(
      BOARD_LIMIT_MAX,
      Math.max(BOARD_LIMIT_DEFAULT, Number.parseInt(params.board_limit ?? String(BOARD_LIMIT_DEFAULT), 10) || BOARD_LIMIT_DEFAULT)
    );

    let query = supabase
      .from("leads")
      .select(BOARD_SELECT, { count: "exact" })
      .is("deleted_at", null)
      .neq("status", "converted")
      .order("updated_at", { ascending: false })
      .limit(boardLimit);

    query = applyAgentScope(query);

    if (params.assigned && params.assigned !== "all") {
      if (params.assigned === "unassigned") {
        query = query.is("assigned_to", null);
      } else {
        query = query.eq("assigned_to", params.assigned);
      }
    }
    query = applySearch(query);
    query = applySlaFilter(query);

    const [{ data: stages }, { data: leads, error, count }] = await Promise.all([
      supabase.from("lead_stages").select("*").eq("is_active", true).order("sort"),
      query,
    ]);

    if (error) console.error("[leads-board] query error:", error.message);

    const rows = (leads ?? []) as unknown as BoardLeadQueryRow[];
    /** Completed (won/converted) leads live on Deals Completed — hide that column here. */
    const boardStages = ((stages ?? []) as unknown as LeadStage[]).filter((s) => s.kind !== "won");

    return {
      stages: boardStages,
      /** Full rows kept server-side for dup calc; stripped before client render. */
      queryRows: rows,
      leads: rows.map(stripBoardContactFields),
      count: count ?? 0,
      boardLimit,
    };
  };

  const fetchListData = async () => {
    const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
    const from = (page - 1) * LIST_PAGE_SIZE;
    const to = from + LIST_PAGE_SIZE - 1;

    let query = supabase
      .from("leads")
      .select(LIST_SELECT, { count: "exact" })
      .is("deleted_at", null)
      .neq("status", "converted")
      .order("created_at", { ascending: false });

    query = applyAgentScope(query);

    if (params.source && params.source !== "all") {
      query = query.eq("source", params.source);
    }
    if (params.assigned && params.assigned !== "all") {
      if (params.assigned === "unassigned") {
        query = query.is("assigned_to", null);
      } else {
        query = query.eq("assigned_to", params.assigned);
      }
    }
    if (params.stage && params.stage !== "all") {
      query = query.eq("stage_id", params.stage);
    }
    query = applySearch(query);
    query = applySlaFilter(query);

    const [{ data: leads, error, count }, { data: agents }, { data: stages }] = await Promise.all([
      query.range(from, to),
      supabase
        .from("profiles")
        .select("id, full_name, role")
        .in("role", ["admin", "manager", "reception", "agent"])
        .eq("is_active", true)
        .order("full_name"),
      supabase
        .from("lead_stages")
        .select("id, name, color")
        .eq("is_active", true)
        .order("sort"),
    ]);

    if (error) console.error("[leads-list] query error:", error.message);

    return {
      leads: (leads ?? []) as unknown as LeadRow[],
      count: count ?? 0,
      page,
      pageSize: LIST_PAGE_SIZE,
      agents: agents ?? [],
      stages: stages ?? [],
    };
  };

  const [boardData, listData, agentsResult, areasResult, nationalitiesResult, fieldOptionsResult] = await Promise.all([
    view === "board" ? fetchBoardData() : Promise.resolve(null),
    view === "list" ? fetchListData() : Promise.resolve(null),
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["admin", "manager", "reception", "agent"])
      .eq("is_active", true)
      .order("full_name"),
    supabase.from("lead_areas").select("name").order("name"),
    supabase.from("lead_nationalities").select("name").order("name"),
    supabase.from("lead_field_options").select("id, field_key, value, label, sort, extra").order("sort").order("label"),
  ]);

  const groupedOptions = groupLeadFieldOptions((fieldOptionsResult.data ?? []) as LeadFieldOption[]);
  const agents = agentsResult.data ?? [];
  const areaNames = (areasResult.data ?? []).map((row) => row.name);
  const nationalityNames = (nationalitiesResult.data ?? []).map((row) => row.name);
  const visibleLeads = boardData?.leads ?? [];
  const queryRows = boardData?.queryRows ?? [];
  const normalize = (value: string | null) => (value ?? "").trim().toLowerCase();

  /** Accidental dups only — same phone/email but not intentionally linked to the same owner. */
  const contactGroups = new Map<string, { id: string; customer_id: string | null }[]>();
  for (const lead of queryRows) {
    const phone = normalize(lead.phone);
    const email = normalize(lead.email);
    const keys = [
      phone ? `p:${phone}` : null,
      email ? `e:${email}` : null,
    ].filter(Boolean) as string[];
    for (const key of keys) {
      const list = contactGroups.get(key) ?? [];
      list.push({ id: lead.id, customer_id: lead.customer_id ?? null });
      contactGroups.set(key, list);
    }
  }
  const duplicateLeadIds: string[] = [];
  const sameOwnerNav: Record<string, { count: number }> = {};
  const seenDup = new Set<string>();

  // Accidental dups: same phone/email but not all linked to one owner.
  for (const group of contactGroups.values()) {
    if (group.length < 2) continue;
    const ownerIds = new Set(group.map((row) => row.customer_id).filter(Boolean) as string[]);
    const allSameOwner =
      ownerIds.size === 1 && group.every((row) => row.customer_id && row.customer_id === [...ownerIds][0]);
    if (allSameOwner) continue;
    for (const row of group) {
      if (seenDup.has(row.id)) continue;
      seenDup.add(row.id);
      duplicateLeadIds.push(row.id);
    }
  }

  // Same-owner multi-leads: badge count only (not a nav link).
  const byOwner = new Map<string, BoardLead[]>();
  for (const lead of visibleLeads) {
    if (!lead.customer_id) continue;
    const list = byOwner.get(lead.customer_id) ?? [];
    list.push(lead);
    byOwner.set(lead.customer_id, list);
  }
  for (const group of byOwner.values()) {
    if (group.length < 2) continue;
    for (const lead of group) {
      sameOwnerNav[lead.id] = { count: group.length };
    }
  }

  const buildBoardLimitHref = () => {
    const current = boardData?.boardLimit ?? BOARD_LIMIT_DEFAULT;
    const next = Math.min(BOARD_LIMIT_MAX, current + BOARD_LIMIT_STEP);
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (!value || key === "board_limit") continue;
      query.set(key, value);
    }
    query.set("view", "board");
    query.set("board_limit", String(next));
    return `/leads?${query.toString()}`;
  };

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground tabular-nums">
            {view === "board" ? boardData?.count ?? 0 : listData?.count ?? 0}
          </span>{" "}
          in pipeline
          {view === "board" && (boardData?.count ?? 0) > (boardData?.boardLimit ?? BOARD_LIMIT_DEFAULT) ? (
            <span className="text-amber-700"> · showing latest {boardData?.boardLimit ?? BOARD_LIMIT_DEFAULT}</span>
          ) : null}
        </p>
        {view === "board" &&
        (boardData?.count ?? 0) > (boardData?.boardLimit ?? BOARD_LIMIT_DEFAULT) &&
        (boardData?.boardLimit ?? BOARD_LIMIT_DEFAULT) < BOARD_LIMIT_MAX ? (
          <Link
            href={buildBoardLimitHref()}
            className="mr-auto text-sm font-medium text-primary hover:underline"
          >
            Load {BOARD_LIMIT_STEP} more on board
          </Link>
        ) : null}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="inline-flex h-8 rounded-md border border-border bg-card p-0.5">
            <Link
              href={buildViewHref("board")}
              className={cn(
                "inline-flex items-center gap-1 rounded px-2.5 text-xs font-medium",
                view === "board" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <KanbanSquare className="h-3.5 w-3.5" />
              Board
            </Link>
            <Link
              href={buildViewHref("list")}
              className={cn(
                "inline-flex items-center gap-1 rounded px-2.5 text-xs font-medium",
                view === "list" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-3.5 w-3.5" />
              List
            </Link>
          </div>
          <Link
            href="/pipeline/completed"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Deals completed
          </Link>
          {user.role !== "agent" && (
            <LeadsAgentFilter agents={agents} assigned={params.assigned} />
          )}
          <LeadCreateDialog
            agents={agents}
            areas={areaNames}
            nationalities={nationalityNames}
            fieldOptions={groupedOptions}
          />
        </div>
      </div>

      {params.sla === "first_response_overdue" ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          <span>Showing leads that missed first-response SLA (assigned, not yet contacted).</span>
          <Link href="/leads?view=list" className="font-medium text-red-900 hover:underline">
            Clear filter
          </Link>
        </div>
      ) : null}

      {view === "board" ? (
        <LeadsBoard
          stages={boardData?.stages ?? []}
          leads={boardData?.leads ?? []}
          duplicateLeadIds={duplicateLeadIds}
          sameOwnerNav={sameOwnerNav}
          userRole={user.role}
          fieldOptions={groupedOptions}
        />
      ) : (
        <LeadsTable
          leads={listData?.leads ?? []}
          agents={listData?.agents ?? []}
          stages={listData?.stages ?? []}
          currentFilters={params}
          userRole={user.role}
          fieldOptions={groupedOptions}
          totalCount={listData?.count ?? 0}
          page={listData?.page ?? 1}
          pageSize={listData?.pageSize ?? LIST_PAGE_SIZE}
        />
      )}
    </div>
  );
}

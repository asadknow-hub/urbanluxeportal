import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LeadsBoard, type BoardLead, type LeadStage } from "@/components/leads/leads-board";
import { LeadsTable, type LeadRow } from "@/components/leads/leads-table";
import { LeadCreateDialog } from "@/components/leads/lead-create-dialog";
import { LeadsAgentFilter } from "@/components/leads/leads-agent-filter";
import Link from "next/link";
import { KanbanSquare, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { groupLeadFieldOptions, type LeadFieldOption } from "@/lib/lead-field-options";
import { sweepFirstResponseSla } from "@/server/first-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LIST_PAGE_SIZE = 50;

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
  }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;
  const view = params.view === "list" ? "list" : "board";
  await sweepFirstResponseSla();

  const buildViewHref = (nextView: "board" | "list") => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (!value || key === "view") continue;
      query.set(key, value);
    }
    query.set("view", nextView);
    return `/leads?${query.toString()}`;
  };

  const commonSelect = `*, assigned_to_profile:profiles!leads_assigned_to_fkey(id, full_name, avatar_url)`;

  const fetchBoardData = async () => {
    let query = supabase
      .from("leads")
      .select(
        `id, name, phone, email, interest, budget_min, budget_max, preferred_areas,
         stage_id, assigned_to, next_follow_up_at, created_at, updated_at, last_activity_at, stage_entered_at, tags,
         first_response_due_at, first_responded_at, first_response_minutes,
         assigned_to_profile:profiles!leads_assigned_to_fkey(id, full_name, avatar_url)`,
        { count: "exact" }
      )
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(200);

    if (user.role === "agent") {
      query = query.or(`assigned_to.eq.${user.id},assigned_to.is.null`);
    }

    if (params.assigned && params.assigned !== "all") {
      if (params.assigned === "unassigned") {
        query = query.is("assigned_to", null);
      } else {
        query = query.eq("assigned_to", params.assigned);
      }
    }
    if (params.q) {
      query = query.or(`name.ilike.%${params.q}%,phone.ilike.%${params.q}%,email.ilike.%${params.q}%`);
    }

    const [{ data: stages }, { data: leads, error, count }] = await Promise.all([
      supabase.from("lead_stages").select("*").eq("is_active", true).order("sort"),
      query,
    ]);

    if (error) console.error("[leads-board] query error:", error.message);

    return {
      stages: (stages ?? []) as unknown as LeadStage[],
      leads: (leads ?? []) as unknown as BoardLead[],
      count: count ?? 0,
    };
  };

  const fetchListData = async () => {
    const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
    const from = (page - 1) * LIST_PAGE_SIZE;
    const to = from + LIST_PAGE_SIZE - 1;

    let query = supabase
      .from("leads")
      .select(commonSelect, { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (user.role === "agent") {
      query = query.or(`assigned_to.eq.${user.id},assigned_to.is.null`);
    }

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
    if (params.q) {
      query = query.or(`name.ilike.%${params.q}%,phone.ilike.%${params.q}%,email.ilike.%${params.q}%`);
    }

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
  const normalize = (value: string | null) => (value ?? "").trim().toLowerCase();
  const phoneCounts = new Map<string, number>();
  const emailCounts = new Map<string, number>();
  for (const lead of visibleLeads) {
    const phone = normalize(lead.phone);
    const email = normalize(lead.email);
    if (phone) phoneCounts.set(phone, (phoneCounts.get(phone) ?? 0) + 1);
    if (email) emailCounts.set(email, (emailCounts.get(email) ?? 0) + 1);
  }
  const duplicateLeadIds = visibleLeads
    .filter((lead) => {
      const phone = normalize(lead.phone);
      const email = normalize(lead.email);
      return (phone && (phoneCounts.get(phone) ?? 0) > 1) || (email && (emailCounts.get(email) ?? 0) > 1);
    })
    .map((lead) => lead.id);

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground tabular-nums">
            {view === "board" ? boardData?.count ?? 0 : listData?.count ?? 0}
          </span>{" "}
          in pipeline
          {view === "board" && (boardData?.count ?? 0) > 200 ? (
            <span className="text-amber-700"> · showing latest 200</span>
          ) : null}
        </p>
        <div className="flex flex-wrap items-center gap-2">
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

      {view === "board" ? (
        <LeadsBoard
          stages={boardData?.stages ?? []}
          leads={boardData?.leads ?? []}
          duplicateLeadIds={duplicateLeadIds}
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

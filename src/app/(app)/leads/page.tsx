import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LeadsBoard, type BoardLead, type LeadStage } from "@/components/leads/leads-board";
import { LeadsTable, type LeadRow } from "@/components/leads/leads-table";
import { LeadCreateDialog } from "@/components/leads/lead-create-dialog";
import Link from "next/link";
import { KanbanSquare, List } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LeadsBoardPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    status?: string;
    source?: string;
    assigned?: string;
    q?: string;
    stage?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;
  const view = params.view === "list" ? "list" : "board";

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
         stage_id, assigned_to, next_follow_up_at, created_at, updated_at, last_activity_at, tags,
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
    let query = supabase
      .from("leads")
      .select(commonSelect, { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (user.role === "agent") {
      query = query.or(`assigned_to.eq.${user.id},assigned_to.is.null`);
    }

    if (params.status && params.status !== "all") {
      query = query.eq("status", params.status);
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
      query.limit(100),
      supabase
        .from("profiles")
        .select("id, full_name, role")
        .in("role", ["admin", "manager", "agent"])
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
      agents: agents ?? [],
      stages: stages ?? [],
    };
  };

  const [boardData, listData, agentsResult] = await Promise.all([
    view === "board" ? fetchBoardData() : Promise.resolve(null),
    view === "list" ? fetchListData() : Promise.resolve(null),
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["admin", "manager", "agent"])
      .eq("is_active", true)
      .order("full_name"),
  ]);

  const agents = agentsResult.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500">
            {view === "board" ? `${boardData?.count ?? 0} total leads` : `${listData?.count ?? 0} total leads`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <Link
              href={buildViewHref("board")}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                view === "board" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <KanbanSquare className="h-4 w-4" />
              Board
            </Link>
            <Link
              href={buildViewHref("list")}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                view === "list" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <List className="h-4 w-4" />
              List
            </Link>
          </div>
          <LeadCreateDialog agents={agents} />
        </div>
      </div>

      {view === "board" ? (
        <LeadsBoard
          stages={boardData?.stages ?? []}
          leads={boardData?.leads ?? []}
          userRole={user.role}
        />
      ) : (
        <LeadsTable
          leads={listData?.leads ?? []}
          agents={listData?.agents ?? []}
          stages={listData?.stages ?? []}
          currentFilters={params}
          userRole={user.role}
        />
      )}
    </div>
  );
}

import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LeadsBoard, type BoardLead, type LeadStage } from "@/components/leads/leads-board";
import { LeadsTable, type LeadRow } from "@/components/leads/leads-table";
import { LeadCreateDialog } from "@/components/leads/lead-create-dialog";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { KanbanSquare, List, Search } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Minimalist White Header */}
      <div className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200/60 bg-white p-5 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <KanbanSquare className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-none mb-1">Lead Pipeline</h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
              {view === "board" ? `${boardData?.count ?? 0} total leads` : `${listData?.count ?? 0} total leads`} · Manage opportunities
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          <form action="/leads" method="get" className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search leads..."
              className="w-full sm:w-56 pl-9 h-9 bg-slate-50 border-slate-200 text-sm text-slate-900 focus-visible:ring-emerald-500 rounded-lg"
            />
            <input type="hidden" name="view" value={view} />
            {params.status && <input type="hidden" name="status" value={params.status} />}
            {params.source && <input type="hidden" name="source" value={params.source} />}
            {params.assigned && <input type="hidden" name="assigned" value={params.assigned} />}
            {params.stage && <input type="hidden" name="stage" value={params.stage} />}
          </form>

          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 shadow-inner h-9">
            <Link
              href={buildViewHref("board")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 text-xs font-bold transition-all duration-200",
                view === "board" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <KanbanSquare className="h-3.5 w-3.5" />
              Board
            </Link>
            <Link
              href={buildViewHref("list")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 text-xs font-bold transition-all duration-200",
                view === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <List className="h-3.5 w-3.5" />
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
          duplicateLeadIds={duplicateLeadIds}
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

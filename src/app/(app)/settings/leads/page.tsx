import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadsInflowClient, type LeadInflowTab } from "@/components/leads/leads-inflow-client";
import { LeadFieldsWorkspace } from "@/components/leads/lead-fields-workspace";
import { StageSlaEditor } from "@/components/leads/stage-sla-editor";
import { fetchLeadTableColumns } from "@/server/lead-areas";
import { ArrowRight, CalendarClock, CheckCircle2, Layers3, Settings2, Route, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const HUB_TABS = [
  { key: "overview", label: "Overview" },
  { key: "sources", label: "Sources" },
  { key: "fields", label: "Fields" },
  { key: "mapping", label: "Mapping" },
  { key: "stages", label: "Stages" },
  { key: "routing", label: "Routing" },
  { key: "documents", label: "Documents" },
] as const;

type HubTab = (typeof HUB_TABS)[number]["key"];

function isHubTab(value: string | undefined): value is HubTab {
  return !!value && HUB_TABS.some((tab) => tab.key === value);
}

function formatStageKind(kind: string) {
  return kind.replace(/_/g, " ");
}

function describeTarget(action: Record<string, unknown>) {
  const type = String(action.type ?? "");
  if (type === "round_robin") {
    return "Round robin assignment";
  }
  if (type === "assign") {
    return `Assign to ${String(action.user_id ?? action.team_id ?? "configured user")}`;
  }
  if (type === "pool") {
    return "Leave in pool";
  }
  return type || "Configured action";
}

export default async function LeadsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; field?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "manager") redirect("/dashboard");

  const supabase = await createSupabaseServerClient();
  const params = await searchParams;
  const tab: HubTab = isHubTab(params.tab) ? params.tab : "fields";
  const inflowTab: LeadInflowTab = tab === "mapping" ? "mapping" : "sources";

  const [sourcesResult, stagesResult, routingResult, docsResult, reasonsResult, sourceStatsResult, leadStatsResult, areasResult, nationalitiesResult, leadColumns] = await Promise.all([
    supabase.from("lead_sources").select("*").order("created_at", { ascending: false }),
    supabase.from("lead_stages").select("*").eq("is_active", true).order("sort", { ascending: true }),
    supabase.from("routing_rules").select("*").eq("is_active", true).order("sort", { ascending: true }),
    supabase.from("lead_doc_requirements").select("*").eq("is_active", true).order("sort", { ascending: true }),
    supabase.from("lost_reasons").select("kind, label, sort").eq("is_active", true).order("sort", { ascending: true }),
    supabase.from("leads").select("source_id").not("source_id", "is", null),
    supabase.from("leads").select("stage_id").not("stage_id", "is", null),
    supabase.from("lead_areas").select("id, name").order("name"),
    supabase.from("lead_nationalities").select("id, name").order("name"),
    fetchLeadTableColumns(),
  ]);

  if (sourcesResult.error) console.error("[settings/leads] sources query error:", sourcesResult.error.message);
  if (stagesResult.error) console.error("[settings/leads] stages query error:", stagesResult.error.message);
  if (routingResult.error) console.error("[settings/leads] routing query error:", routingResult.error.message);
  if (docsResult.error) console.error("[settings/leads] docs query error:", docsResult.error.message);
  if (reasonsResult.error) console.error("[settings/leads] reasons query error:", reasonsResult.error.message);
  if (sourceStatsResult.error) console.error("[settings/leads] source stats query error:", sourceStatsResult.error.message);
  if (leadStatsResult.error) console.error("[settings/leads] lead stats query error:", leadStatsResult.error.message);

  const sources = sourcesResult.data ?? [];
  const fieldCount = leadColumns.length;
  const stages = stagesResult.data ?? [];
  const routingRules = routingResult.data ?? [];
  const docReqs = docsResult.data ?? [];
  const lostReasons = reasonsResult.data ?? [];

  const sourceCountMap: Record<string, number> = {};
  (sourceStatsResult.data ?? []).forEach((row: { source_id: string | null }) => {
    if (row.source_id) sourceCountMap[row.source_id] = (sourceCountMap[row.source_id] ?? 0) + 1;
  });

  const stageCountMap: Record<string, number> = {};
  (leadStatsResult.data ?? []).forEach((row: { stage_id: string | null }) => {
    if (row.stage_id) stageCountMap[row.stage_id] = (stageCountMap[row.stage_id] ?? 0) + 1;
  });

  const activeFields = fieldCount;
  const areaCount = areasResult.data?.length ?? 0;

  return (
    <div className="mx-auto max-w-[1600px] space-y-4">
      <nav
        aria-label="Lead settings sections"
        className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1"
      >
        {HUB_TABS.map((item) => (
          <Link
            key={item.key}
            href={item.key === "fields" ? "/settings/leads?tab=fields" : `/settings/leads?tab=${item.key}`}
            className={cn(
              "inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium transition-colors",
              tab === item.key
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="space-y-6">
          {/* Top Metrics Bento Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="group rounded-xl bg-white p-3 shadow-sm border border-slate-200/60 hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1 transition-all duration-300">
               <div className="flex items-center gap-3 mb-4">
                 <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                   <Route className="h-4 w-4" />
                 </div>
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Sources</h3>
               </div>
               <div className="text-2xl font-bold text-slate-900">{sources.length}</div>
               <p className="mt-2 text-xs font-medium text-slate-400">Active capture channels</p>
            </div>
            
            <div className="group rounded-xl bg-white p-3 shadow-sm border border-slate-200/60 hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1 transition-all duration-300">
               <div className="flex items-center gap-3 mb-4">
                 <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                   <Layers3 className="h-4 w-4" />
                 </div>
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Stages</h3>
               </div>
               <div className="text-2xl font-bold text-slate-900">{stages.length}</div>
               <p className="mt-2 text-xs font-medium text-slate-400">Flow states</p>
            </div>
            
            <div className="group rounded-xl bg-white p-3 shadow-sm border border-slate-200/60 hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1 transition-all duration-300">
               <div className="flex items-center gap-3 mb-4">
                 <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                   <Settings2 className="h-4 w-4" />
                 </div>
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Rules</h3>
               </div>
               <div className="text-2xl font-bold text-slate-900">{routingRules.length}</div>
               <p className="mt-2 text-xs font-medium text-slate-400">Routing & SLAs</p>
            </div>
            
            <div className="group rounded-xl bg-white p-3 shadow-sm border border-slate-200/60 hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1 transition-all duration-300">
               <div className="flex items-center gap-3 mb-4">
                 <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                   <FileText className="h-4 w-4" />
                 </div>
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Fields</h3>
               </div>
               <div className="text-2xl font-bold text-slate-900">{activeFields}</div>
               <p className="mt-2 text-xs font-medium text-slate-400">{areaCount} preferred areas configured</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200/60 lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <Layers3 className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Activation Flow</h2>
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-5">
                1. Capture via a source, form, webhook, or manual entry.<br/>
                2. Normalize and map fields into the lead model.<br/>
                3. Enter the stage flow and apply routing / SLA rules.<br/>
                4. Follow up, qualify, and convert into a customer and deal.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100/50">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Next stop</p>
                  <div className="mt-3 flex items-center gap-3 text-sm font-bold text-slate-700">
                    <CalendarClock className="h-5 w-5 text-emerald-500" />
                    Follow-ups and SLA reclaim
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100/50">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Conversion target</p>
                  <div className="mt-3 flex items-center gap-3 text-sm font-bold text-slate-700">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    Customer + deal creation
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200/60">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <Settings2 className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Quick Links</h2>
              </div>
              <div className="space-y-3">
                <Link href="/leads?view=board" className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-white hover:border-slate-200 hover:shadow-md">
                  <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700">Open Leads board</span>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </Link>
                <Link href="/leads?view=list" className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-white hover:border-slate-200 hover:shadow-md">
                  <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700">Open list view</span>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </Link>
                <Link href="/leads/followups" className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-white hover:border-slate-200 hover:shadow-md">
                  <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700">Open follow-ups</span>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </Link>
                <Link href="/deals" className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-white hover:border-slate-200 hover:shadow-md">
                  <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700">Open deals pipeline</span>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "fields" && (
        <LeadFieldsWorkspace
          areas={areasResult.data ?? []}
          nationalities={nationalitiesResult.data ?? []}
          initialField={params.field}
        />
      )}

      {(tab === "sources" || tab === "mapping") && (
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200/60 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <Route className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Capture Configuration</h2>
          </div>
          <div>
            <LeadsInflowClient
              sources={sources}
              statsMap={sourceCountMap}
              initialTab={inflowTab}
            />
          </div>
        </div>
      )}

      {tab === "stages" && (
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200/60">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Layers3 className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Activation Stages</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {stages.map((stage: { id: string; name: string; color: string; kind: string; sort: number; helper_text: string | null; required_fields: unknown; stale_after_days: number | null }) => (
                <div key={stage.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 hover:border-slate-200 hover:shadow-sm transition-all flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-slate-900">{stage.name}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">{formatStageKind(stage.kind)} · Sort {stage.sort}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold tracking-wider text-slate-600 shadow-sm border border-slate-100">{stage.color}</span>
                  </div>
                  {stage.helper_text && <p className="mt-3 text-sm font-medium text-slate-600 leading-relaxed">{stage.helper_text}</p>}
                  
                  <div className="mt-auto pt-3">
                    <div className="border-t border-slate-200/60 pt-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Required Fields</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(stage.required_fields) && stage.required_fields.length > 0 ? stage.required_fields.map((field) => (
                          <span key={String(field)} className="rounded-md bg-white border border-slate-200/60 px-2 py-1 text-[10px] font-bold text-slate-600">
                            {String(field).replace(/_/g, " ")}
                          </span>
                        )) : <span className="text-xs text-slate-400 font-medium">None</span>}
                      </div>
                    </div>
                    <StageSlaEditor stageId={stage.id} value={stage.stale_after_days} />
                    <div className="mt-3 flex items-center gap-2">
                      <span className="flex h-5 items-center justify-center rounded bg-emerald-100 px-2 text-[10px] font-bold text-emerald-700">{stageCountMap[stage.id] ?? 0}</span>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Leads in stage</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200/60">
            <h2 className="text-base font-bold text-slate-900 mb-4">Lost and Junk Reasons</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {(["lost", "junk"] as const).map((kind) => (
                <div key={kind} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">{kind}</p>
                  <div className="flex flex-wrap gap-2">
                    {lostReasons.filter((reason: { kind: string }) => reason.kind === kind).map((reason: { label: string; kind: string }) => (
                      <span key={reason.label} className="rounded-full bg-white border border-slate-200/60 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
                        {reason.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "routing" && (
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <Route className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Routing and SLA Rules</h2>
          </div>
          <div className="space-y-4">
            {routingRules.length === 0 ? (
              <p className="text-sm font-medium text-slate-500">No routing rules found.</p>
            ) : (
              <div className="grid gap-4">
                {routingRules.map((rule: { id: string; sort: number; conditions: Record<string, unknown>; action: Record<string, unknown>; is_active: boolean }) => (
                  <div key={rule.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 hover:border-slate-200 transition-colors">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm border border-slate-200/60 text-sm font-bold text-slate-700">
                          {rule.sort}
                        </span>
                        <div>
                          <p className="text-base font-bold text-slate-900">{describeTarget(rule.action)}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm",
                        rule.is_active ? "bg-emerald-100 text-emerald-700 border border-emerald-200/50" : "bg-white text-slate-500 border border-slate-200"
                      )}>
                        {rule.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 mt-6 border-t border-slate-200/60 pt-6">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Conditions</p>
                        <pre className="overflow-x-auto rounded-xl bg-white border border-slate-200/60 p-4 text-[11px] font-medium text-slate-600 shadow-inner max-h-40 overflow-y-auto custom-scrollbar">
                          {JSON.stringify(rule.conditions, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Action Config</p>
                        <pre className="overflow-x-auto rounded-xl bg-white border border-slate-200/60 p-4 text-[11px] font-medium text-slate-600 shadow-inner max-h-40 overflow-y-auto custom-scrollbar">
                          {JSON.stringify(rule.action, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "documents" && (
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <FileText className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Lead Document Requirements</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {docReqs.map((req: { id: string; name: string; slots: Array<{ key: string; label: string }> | null; applies_when: Record<string, unknown>; required: boolean; allowed_types: string[]; max_mb: number }) => (
              <div key={req.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 hover:border-slate-200 transition-colors flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-base font-bold text-slate-900">{req.name}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">{req.required ? "Required" : "Optional"} · {req.max_mb} MB max</p>
                  </div>
                  <span className="rounded-full bg-white border border-slate-200/60 shadow-sm px-2.5 py-1 text-[10px] font-bold text-slate-500 tracking-wide uppercase">
                    {req.allowed_types.join(", ")}
                  </span>
                </div>
                
                <div className="mt-auto space-y-4 pt-4 border-t border-slate-200/60">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Available Slots</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(req.slots ?? []).map((slot) => (
                        <span key={slot.key} className="rounded-md bg-white border border-slate-200/60 shadow-sm px-2 py-1 text-[10px] font-bold text-slate-700">
                          {slot.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Applies When</p>
                    <pre className="overflow-x-auto rounded-xl bg-white border border-slate-200/60 p-3 text-[11px] font-medium text-slate-600 shadow-inner max-h-32 overflow-y-auto custom-scrollbar">
                      {JSON.stringify(req.applies_when, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

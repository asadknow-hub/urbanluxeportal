import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadFieldsWorkspace } from "@/components/leads/lead-fields-workspace";
import { StageSlaEditor } from "@/components/leads/stage-sla-editor";
import { fetchLeadTableColumns } from "@/server/lead-areas";
import { groupLeadFieldOptions, type LeadFieldOption } from "@/lib/lead-field-options";
import { ArrowRight, CalendarClock, CheckCircle2, Layers3, Settings2, Route, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const HUB_TABS = [
  { key: "overview", label: "Overview" },
  { key: "fields", label: "Fields" },
  { key: "stages", label: "Stages" },
] as const;

type HubTab = (typeof HUB_TABS)[number]["key"];

function isHubTab(value: string | undefined): value is HubTab {
  return !!value && HUB_TABS.some((tab) => tab.key === value);
}

function formatStageKind(kind: string) {
  return kind.replace(/_/g, " ");
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

  const [stagesResult, leadStatsResult, areasResult, nationalitiesResult, fieldOptionsResult, leadColumns] = await Promise.all([
    supabase.from("lead_stages").select("*").eq("is_active", true).order("sort", { ascending: true }),
    supabase.from("leads").select("stage_id").not("stage_id", "is", null),
    supabase.from("lead_areas").select("id, name").order("name"),
    supabase.from("lead_nationalities").select("id, name").order("name"),
    supabase.from("lead_field_options").select("id, field_key, value, label, sort, extra").order("sort").order("label"),
    fetchLeadTableColumns(),
  ]);

  if (stagesResult.error) console.error("[settings/leads] stages query error:", stagesResult.error.message);
  if (leadStatsResult.error) console.error("[settings/leads] lead stats query error:", leadStatsResult.error.message);

  const fieldOptions = groupLeadFieldOptions((fieldOptionsResult.data ?? []) as LeadFieldOption[]);
  const fieldCount = leadColumns.length;
  const stages = stagesResult.data ?? [];

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="group rounded-xl bg-white p-3 shadow-sm border border-slate-200/60 hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1 transition-all duration-300">
               <div className="flex items-center gap-3 mb-4">
                 <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                   <Route className="h-4 w-4" />
                 </div>
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Stages</h3>
               </div>
               <div className="text-2xl font-bold text-slate-900">{stages.length}</div>
               <p className="mt-2 text-xs font-medium text-slate-400">Flow states</p>
            </div>
            
            <div className="group rounded-xl bg-white p-3 shadow-sm border border-slate-200/60 hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1 transition-all duration-300">
               <div className="flex items-center gap-3 mb-4">
                 <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                   <CalendarClock className="h-4 w-4" />
                 </div>
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">SLA</h3>
               </div>
               <div className="text-2xl font-bold text-slate-900">{stages.filter((s: { stale_after_days: number | null }) => s.stale_after_days != null).length}</div>
               <p className="mt-2 text-xs font-medium text-slate-400">Stages with stale timers</p>
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
                1. Create or capture a lead with the Fields picklists.<br/>
                2. Move through stages and honor SLA timers.<br/>
                3. Follow up, qualify, and convert into a customer and deal.
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
          fieldOptions={fieldOptions}
          initialField={params.field}
        />
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
                    {(kind === "lost" ? fieldOptions.lost_reason : fieldOptions.junk_reason)?.map((reason) => (
                      <span key={reason.id} className="rounded-full bg-white border border-slate-200/60 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
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
    </div>
  );
}

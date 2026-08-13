import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadsInflowClient, type LeadInflowTab } from "@/components/leads/leads-inflow-client";
import { ArrowRight, CalendarClock, CheckCircle2, Layers3, Settings2, Route, FileText } from "lucide-react";

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
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "manager") redirect("/dashboard");

  const supabase = await createSupabaseServerClient();
  const params = await searchParams;
  const tab: HubTab = isHubTab(params.tab) ? params.tab : "overview";
  const inflowTab: LeadInflowTab = tab === "fields" || tab === "mapping" ? tab : "sources";

  const [sourcesResult, fieldDefsResult, stagesResult, routingResult, docsResult, reasonsResult, sourceStatsResult, leadStatsResult] = await Promise.all([
    supabase.from("lead_sources").select("*").order("created_at", { ascending: false }),
    supabase.from("custom_field_defs").select("*").eq("entity", "lead").order("is_active", { ascending: false }).order("sort", { ascending: true }),
    supabase.from("lead_stages").select("*").eq("is_active", true).order("sort", { ascending: true }),
    supabase.from("routing_rules").select("*").eq("is_active", true).order("sort", { ascending: true }),
    supabase.from("lead_doc_requirements").select("*").eq("is_active", true).order("sort", { ascending: true }),
    supabase.from("lost_reasons").select("kind, label, sort").eq("is_active", true).order("sort", { ascending: true }),
    supabase.from("leads").select("source_id").not("source_id", "is", null),
    supabase.from("leads").select("stage_id").not("stage_id", "is", null),
  ]);

  if (sourcesResult.error) console.error("[settings/leads] sources query error:", sourcesResult.error.message);
  if (fieldDefsResult.error) console.error("[settings/leads] field defs query error:", fieldDefsResult.error.message);
  if (stagesResult.error) console.error("[settings/leads] stages query error:", stagesResult.error.message);
  if (routingResult.error) console.error("[settings/leads] routing query error:", routingResult.error.message);
  if (docsResult.error) console.error("[settings/leads] docs query error:", docsResult.error.message);
  if (reasonsResult.error) console.error("[settings/leads] reasons query error:", reasonsResult.error.message);
  if (sourceStatsResult.error) console.error("[settings/leads] source stats query error:", sourceStatsResult.error.message);
  if (leadStatsResult.error) console.error("[settings/leads] lead stats query error:", leadStatsResult.error.message);

  const sources = sourcesResult.data ?? [];
  const fieldDefs = fieldDefsResult.data ?? [];
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

  const activeFields = fieldDefs.filter((field: { is_active: boolean }) => field.is_active).length;
  const inactiveFields = fieldDefs.length - activeFields;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/settings" className="hover:text-slate-700">Settings</Link>
          <span>/</span>
          <span className="text-slate-900">Leads</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Lead Settings</h1>
        <p className="max-w-3xl text-sm text-slate-500">
          This is the control center for the full lead lifecycle: sources, field mapping, stage flow, routing, and document rules.
          The database tables are already RLS-protected; this page is the admin/manager surface for configuring them end to end.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {HUB_TABS.map((item) => (
          <Link
            key={item.key}
            href={`/settings/leads?tab=${item.key}`}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              tab === item.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-500">Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{sources.length}</div>
                <p className="mt-1 text-xs text-slate-500">Channels feeding the CRM</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-500">Stages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stages.length}</div>
                <p className="mt-1 text-xs text-slate-500">Current activation flow states</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-500">Routing rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{routingRules.length}</div>
                <p className="mt-1 text-xs text-slate-500">Assignment and reclaim logic</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-500">Custom fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{activeFields}</div>
                <p className="mt-1 text-xs text-slate-500">{inactiveFields} inactive, preserved in `leads.custom`</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="rounded-2xl lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers3 className="h-4 w-4 text-emerald-500" />
                  Activation flow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p>
                  1. Capture via a source, form, webhook, or manual entry.
                  2. Normalize and map fields into the lead model.
                  3. Enter the stage flow and apply routing / SLA rules.
                  4. Follow up, qualify, and convert into a customer and deal.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Next stop</p>
                    <div className="mt-2 flex items-center gap-2 text-slate-900">
                      <CalendarClock className="h-4 w-4 text-emerald-500" />
                      Follow-ups and SLA reclaim
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Conversion target</p>
                    <div className="mt-2 flex items-center gap-2 text-slate-900">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Customer + deal creation
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings2 className="h-4 w-4 text-emerald-500" />
                  Quick links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Link href="/leads?view=board" className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50">
                  <span>Open Leads board</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/leads?view=list" className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50">
                  <span>Open list view</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/leads/followups" className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50">
                  <span>Open follow-ups</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/deals" className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50">
                  <span>Open deals pipeline</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {(tab === "sources" || tab === "fields" || tab === "mapping") && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Route className="h-4 w-4 text-emerald-500" />
              Capture configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LeadsInflowClient
              sources={sources}
              fieldDefs={fieldDefs}
              statsMap={sourceCountMap}
              initialTab={inflowTab}
            />
          </CardContent>
        </Card>
      )}

      {tab === "stages" && (
        <div className="space-y-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers3 className="h-4 w-4 text-emerald-500" />
                Activation stages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {stages.map((stage: { id: string; name: string; color: string; kind: string; sort: number; helper_text: string | null; required_fields: unknown }) => (
                  <div key={stage.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{stage.name}</p>
                        <p className="text-xs text-slate-500">{formatStageKind(stage.kind)} · sort {stage.sort}</p>
                      </div>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500 ring-1 ring-slate-200">{stage.color}</span>
                    </div>
                    {stage.helper_text && <p className="mt-3 text-sm text-slate-600">{stage.helper_text}</p>}
                    <p className="mt-3 text-xs text-slate-500">
                      Required fields: {Array.isArray(stage.required_fields) && stage.required_fields.length > 0 ? stage.required_fields.map((field) => String(field).replace(/_/g, " ")).join(", ") : "none"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Leads currently in stage: {stageCountMap[stage.id] ?? 0}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Lost and junk reasons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {(["lost", "junk"] as const).map((kind) => (
                  <div key={kind} className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-900 capitalize">{kind}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {lostReasons.filter((reason: { kind: string }) => reason.kind === kind).map((reason: { label: string; kind: string }) => (
                        <span key={reason.label} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                          {reason.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "routing" && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Route className="h-4 w-4 text-emerald-500" />
              Routing and SLA rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {routingRules.length === 0 ? (
              <p className="text-sm text-slate-500">No routing rules found.</p>
            ) : (
              <div className="space-y-3">
                {routingRules.map((rule: { id: string; sort: number; conditions: Record<string, unknown>; action: Record<string, unknown>; is_active: boolean }) => (
                  <div key={rule.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Rule #{rule.sort}</p>
                        <p className="text-xs text-slate-500">{describeTarget(rule.action)}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${rule.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                        {rule.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Conditions</p>
                        <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{JSON.stringify(rule.conditions, null, 2)}</pre>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Action</p>
                        <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{JSON.stringify(rule.action, null, 2)}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "documents" && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-emerald-500" />
              Lead document requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {docReqs.map((req: { id: string; name: string; slots: Array<{ key: string; label: string }> | null; applies_when: Record<string, unknown>; required: boolean; allowed_types: string[]; max_mb: number }) => (
                <div key={req.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{req.name}</p>
                      <p className="text-xs text-slate-500">{req.required ? "Required" : "Optional"} · {req.max_mb} MB max</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{req.allowed_types.join(", ")}</span>
                  </div>
                  <div className="mt-3 space-y-2 text-xs text-slate-500">
                    <p>Slots:</p>
                    <div className="flex flex-wrap gap-2">
                      {(req.slots ?? []).map((slot) => (
                        <span key={slot.key} className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                          {slot.label}
                        </span>
                      ))}
                    </div>
                    <p className="pt-2">Applies when:</p>
                    <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{JSON.stringify(req.applies_when, null, 2)}</pre>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LeadFieldsWorkspace } from "@/components/leads/lead-fields-workspace";
import { StageSlaEditor } from "@/components/leads/stage-sla-editor";
import { LeadImportWorkspace } from "@/components/leads/lead-import-workspace";
import { fetchLeadTableColumns } from "@/server/lead-areas";
import { groupLeadFieldOptions, type LeadFieldOption } from "@/lib/lead-field-options";
import { ArrowRight, CalendarClock, CheckCircle2, Layers3, Settings2, Route, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const HUB_TABS = [
  { key: "overview", label: "Overview" },
  { key: "fields", label: "Fields" },
  { key: "stages", label: "Stages" },
  { key: "imports", label: "Imports" },
] as const;

type HubTab = (typeof HUB_TABS)[number]["key"];

const STAGE_DOT: Record<string, string> = {
  blue: "bg-blue-500",
  cyan: "bg-sky-500",
  teal: "bg-teal-600",
  purple: "bg-violet-500",
  indigo: "bg-indigo-500",
  green: "bg-emerald-600",
  slate: "bg-slate-500",
  gray: "bg-zinc-500",
  amber: "bg-amber-500",
  red: "bg-red-600",
};

function isHubTab(value: string | undefined): value is HubTab {
  return !!value && HUB_TABS.some((tab) => tab.key === value);
}

function formatStageKind(kind: string) {
  const label = kind.replace(/_/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function stageDot(color: string) {
  return STAGE_DOT[color] ?? "bg-primary";
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

  const slaCount = stages.filter((s: { stale_after_days: number | null }) => s.stale_after_days != null).length;
  const areaCount = areasResult.data?.length ?? 0;

  return (
    <div className="mx-auto max-w-[1600px] space-y-4">
      <nav
        aria-label="Lead settings sections"
        className="flex flex-wrap gap-1 rounded-[14px] border border-border bg-card p-1"
      >
        {HUB_TABS.map((item) => (
          <Link
            key={item.key}
            href={item.key === "fields" ? "/settings/leads?tab=fields" : `/settings/leads?tab=${item.key}`}
            className={cn(
              "inline-flex h-8 cursor-pointer items-center rounded-lg px-3 text-xs font-medium transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              tab === item.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Route, label: "Stages", value: stages.length, hint: "Columns on the leads board" },
              { icon: CalendarClock, label: "SLA", value: slaCount, hint: "Stages with a stale timer" },
              { icon: FileText, label: "Fields", value: fieldCount, hint: `${areaCount} preferred areas` },
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="overflow-hidden rounded-[14px] border border-border bg-card p-4">
                  <div className="-mx-4 -mt-4 mb-4 h-0.5 bg-primary" />
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                  </div>
                  <p
                    className="mt-3 font-heading text-[28px] leading-none text-foreground"
                    style={{ fontFamily: "var(--font-display), serif" }}
                  >
                    {metric.value}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{metric.hint}</p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="overflow-hidden rounded-[14px] border border-border bg-card p-5 lg:col-span-2">
              <div className="-mx-5 -mt-5 mb-5 h-0.5 bg-primary" />
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Layers3 className="h-4 w-4" />
                </span>
                <h2 className="text-base font-semibold text-foreground">How leads move</h2>
              </div>
              <ol className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                <li>1. Capture a lead using the Fields picklists.</li>
                <li>2. Move it across board stages. SLA timers flag leads that sit too long.</li>
                <li>3. Unassigned new leads round-robin to agents. Qualify, then convert to a customer and deal.</li>
              </ol>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[10px] border border-border bg-muted/40 p-4">
                  <p className="text-xs font-medium text-muted-foreground">Next stop</p>
                  <div className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    Follow-ups and SLA
                  </div>
                </div>
                <div className="rounded-[10px] border border-border bg-muted/40 p-4">
                  <p className="text-xs font-medium text-muted-foreground">Conversion</p>
                  <div className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Customer + deal
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[14px] border border-border bg-card p-5">
              <div className="-mx-5 -mt-5 mb-5 h-0.5 bg-primary" />
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Settings2 className="h-4 w-4" />
                </span>
                <h2 className="text-base font-semibold text-foreground">Open in CRM</h2>
              </div>
              <div className="space-y-2">
                {[
                  { href: "/leads?view=board", label: "Leads board" },
                  { href: "/leads?view=list", label: "Leads list" },
                  { href: "/leads/followups", label: "Follow-ups" },
                  { href: "/settings/leads?tab=imports", label: "Import leads" },
                  { href: "/deals", label: "Deals pipeline" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex cursor-pointer items-center justify-between rounded-[10px] border border-border bg-muted/40 px-4 py-3 text-sm font-medium text-foreground transition-colors duration-200 hover:border-primary/40 hover:bg-muted"
                  >
                    {item.label}
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" />
                  </Link>
                ))}
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

      {tab === "imports" && <LeadImportWorkspace />}

      {tab === "stages" && (
        <div className="space-y-5">
          <div className="overflow-hidden rounded-[14px] border border-border bg-card p-5">
            <div className="-mx-5 -mt-5 mb-5 h-0.5 bg-primary" />
            <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Pipeline stages</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  These are the columns on the leads board. Add, rename, or delete stages there.
                  Set how many days a lead can sit in a stage before it is marked stale.
                </p>
              </div>
              <Link
                href="/leads?view=board"
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 text-xs font-medium text-foreground transition-colors duration-200 hover:border-primary/40 hover:bg-muted"
              >
                Open board
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {stages.map((stage: {
                id: string;
                name: string;
                color: string;
                kind: string;
                sort: number;
                helper_text: string | null;
                required_fields: unknown;
                stale_after_days: number | null;
              }) => (
                <div
                  key={stage.id}
                  className="flex flex-col rounded-[14px] border border-border bg-muted/30 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">{stage.name}</p>
                      <p className="mt-1 text-xs capitalize text-muted-foreground">
                        {formatStageKind(stage.kind)} · {stage.sort}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
                      <span className={cn("h-2 w-2 rounded-full", stageDot(stage.color))} />
                      {stage.color}
                    </span>
                  </div>
                  {stage.helper_text ? (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{stage.helper_text}</p>
                  ) : null}

                  <div className="mt-auto pt-4">
                    <div className="border-t border-border pt-3">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Required fields</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(stage.required_fields) && stage.required_fields.length > 0 ? (
                          stage.required_fields.map((field) => (
                            <span
                              key={String(field)}
                              className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
                            >
                              {String(field).replace(/_/g, " ")}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </div>
                    </div>
                    <StageSlaEditor stageId={stage.id} value={stage.stale_after_days} />
                    <div className="mt-3 flex items-center gap-2">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-primary/15 px-2 text-xs font-semibold text-foreground">
                        {stageCountMap[stage.id] ?? 0}
                      </span>
                      <span className="text-xs text-muted-foreground">Leads in this stage</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[14px] border border-border bg-card p-5">
            <div className="-mx-5 -mt-5 mb-5 h-0.5 bg-primary" />
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-foreground">Lost and junk reasons</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Shown when a lead is moved to Lost or Junk. Edit the lists under Fields.
                </p>
              </div>
              <Link
                href="/settings/leads?tab=fields&field=lost_reason"
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 text-xs font-medium text-foreground transition-colors duration-200 hover:border-primary/40 hover:bg-muted"
              >
                Edit in Fields
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {(["lost", "junk"] as const).map((kind) => (
                <div key={kind} className="rounded-[14px] border border-border bg-muted/30 p-4">
                  <p className="mb-3 text-sm font-medium capitalize text-foreground">{kind}</p>
                  <div className="flex flex-wrap gap-2">
                    {(kind === "lost" ? fieldOptions.lost_reason : fieldOptions.junk_reason)?.map((reason) => (
                      <span
                        key={reason.id}
                        className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground"
                      >
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

import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Phone, MessageCircle, Clock, AlertCircle } from "lucide-react";
import { whatsappLink } from "@/lib/phone";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

const GROUPS = [
  { key: "overdue", label: "Overdue", color: "text-red-600", border: "border-red-200", bg: "bg-red-50" },
  { key: "today", label: "Today", color: "text-amber-600", border: "border-amber-200", bg: "bg-amber-50" },
  { key: "tomorrow", label: "Tomorrow", color: "text-blue-600", border: "border-blue-200", bg: "bg-blue-50" },
  { key: "this_week", label: "This Week", color: "text-slate-600", border: "border-slate-200", bg: "bg-slate-50" },
];

export default async function FollowUpsPage() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createSupabaseServerClient();

  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const tomorrowEnd = new Date(todayEnd);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  const weekEnd = new Date(todayEnd);
  weekEnd.setDate(weekEnd.getDate() + 7);

  let query = supabase
    .from("leads")
    .select(
      `id, name, phone, email, next_follow_up_at, stage_id, assigned_to,
       assigned_to_profile:profiles!leads_assigned_to_fkey(id, full_name),
       stage:lead_stages(id, name, color)`,
      { count: "exact" }
    )
    .is("deleted_at", null)
    .not("next_follow_up_at", "is", null)
    .order("next_follow_up_at", { ascending: true })
    .limit(200);

  if (user.role === "agent") {
    query = query.eq("assigned_to", user.id);
  }

  const { data: leads, error } = await query;

  if (error) console.error("[followups] query error:", error.message);

  // Group leads
  type FollowUpLead = NonNullable<typeof leads>[number];
  const groups: Record<string, FollowUpLead[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    this_week: [],
  };

  for (const lead of leads ?? []) {
    if (!lead.next_follow_up_at) continue;
    const fu = new Date(lead.next_follow_up_at);
    if (fu < now) groups.overdue.push(lead);
    else if (fu <= todayEnd) groups.today.push(lead);
    else if (fu <= tomorrowEnd) groups.tomorrow.push(lead);
    else if (fu <= weekEnd) groups.this_week.push(lead);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Follow-ups</h1>
        <p className="text-sm text-slate-500">
          {leads?.length ?? 0} leads with scheduled follow-ups
        </p>
      </div>

      {GROUPS.map((group) => {
        const items = groups[group.key] ?? [];
        if (items.length === 0) return null;
        return (
          <div key={group.key} className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className={`text-sm font-semibold ${group.color}`}>
                {group.label}
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                {items.length}
              </span>
            </div>
            <div className="space-y-2">
              {items.map((lead: any) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className={`flex items-center justify-between rounded-lg border ${group.border} ${group.bg} p-3 hover:shadow-sm transition-shadow`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">{lead.name}</span>
                      <span className="text-xs text-slate-500">
                        {lead.stage?.name ?? "—"}
                        {lead.assigned_to_profile && ` · ${lead.assigned_to_profile.full_name}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {lead.phone && (
                      <a
                        href={whatsappLink(lead.phone) ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    )}
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      {group.key === "overdue" && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(lead.next_follow_up_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      {leads && leads.length === 0 && (
        <div className="flex h-64 items-center justify-center text-slate-400">
          No follow-ups scheduled. Set follow-up dates on your leads to see them here.
        </div>
      )}
    </div>
  );
}

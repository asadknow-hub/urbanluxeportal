import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AutomationsList } from "@/components/settings/automations-list";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (user.role !== "admin") {
    return (
      <div className="p-4">
        <p className="text-sm text-slate-500">Admin access required.</p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: rules, error } = await supabase
    .from("automation_rules")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) console.error("[automations] query error:", error.message);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Workflow Automations</h1>
        <p className="text-sm text-slate-500">Toggle automation rules on or off</p>
      </div>

      <AutomationsList rules={rules ?? []} />
    </div>
  );
}

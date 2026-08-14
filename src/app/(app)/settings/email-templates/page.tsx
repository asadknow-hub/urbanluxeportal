import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EmailTemplatesList } from "@/components/settings/email-templates-list";

export const dynamic = "force-dynamic";

export default async function EmailTemplatesPage() {
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

  const { data: templates, error } = await supabase
    .from("email_templates")
    .select("*")
    .order("key", { ascending: true });

  if (error) console.error("[email-templates] query error:", error.message);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Email Templates</h1>
        <p className="text-sm text-slate-500">Edit subject and body for transactional emails</p>
      </div>

      <EmailTemplatesList templates={templates ?? []} />
    </div>
  );
}

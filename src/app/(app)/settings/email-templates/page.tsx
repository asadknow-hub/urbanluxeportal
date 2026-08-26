import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EmailTemplatesList } from "@/components/settings/email-templates-list";
import { PageHeader } from "@/components/primitives/page-header";

export const dynamic = "force-dynamic";

export default async function EmailTemplatesPage() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (user.role !== "admin") {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">Admin access required.</p>
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
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Email templates"
        description="Subject and body copy for transactional emails."
      />
      <EmailTemplatesList templates={templates ?? []} />
    </div>
  );
}

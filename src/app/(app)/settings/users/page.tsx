import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UsersList } from "@/components/settings/users-list";
import { PageHeader } from "@/components/primitives/page-header";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
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

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active, brn, commission_rate, created_at")
    .order("created_at", { ascending: true });

  if (error) console.error("[users] query error:", error.message);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Users & roles"
        description={`${users?.length ?? 0} staff accounts with portal access.`}
      />
      <UsersList users={users ?? []} />
    </div>
  );
}

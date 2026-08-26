import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UsersList } from "@/components/settings/users-list";
import { PageHeader } from "@/components/primitives/page-header";
import { loadStaffRoster } from "@/server/roster";

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

  const { data: roster, error } = await loadStaffRoster(supabase);
  const users = (roster ?? []).map((row) => ({
    id: row.id,
    email: row.email ?? "",
    full_name: row.full_name ?? "",
    role: row.role,
    is_active: row.is_active,
    brn: row.brn,
    commission_rate: row.commission_rate,
    created_at: row.created_at,
  }));

  if (error) console.error("[users] query error:", error.message);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Users & roles"
        description={`${users.length} staff accounts with portal access.`}
      />
      <UsersList users={users} />
    </div>
  );
}

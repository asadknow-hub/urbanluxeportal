"use server";

import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";
import { canManageCrm, isManagerLike, type UserRole } from "@/lib/permissions";

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

const staffRoleSchema = z.enum(["admin", "manager", "reception", "agent", "accountant"]);

const updateProfileSchema = z.object({
  id: z.string().min(1),
  full_name: z.string().min(1, "Name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional().nullable(),
  role: staffRoleSchema,
  brn: z.string().optional().nullable(),
  commission_rate: z.number().min(0).max(100).optional().nullable(),
  is_active: z.boolean(),
  avatar_url: z.string().optional().nullable(),
});

function canAssignRole(actorRole: string, targetRole: string) {
  if (actorRole === "admin") return true;
  return targetRole === "agent" || targetRole === "accountant";
}

async function findAuthUserIdByEmail(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  email: string
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", normalized)
    .maybeSingle();
  if (profile?.id) return profile.id;

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) break;
    const found = data.users.find((row) => row.email?.toLowerCase() === normalized);
    if (found) return found.id;
    if (data.users.length < 200) break;
  }
  return null;
}

export async function updateStaffProfile(
  input: z.infer<typeof updateProfileSchema>
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!canManageCrm(user.role)) {
      return { ok: false, error: "Not authorized" };
    }

    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const { id, ...updates } = parsed.data;
    if (!canAssignRole(user.role, updates.role)) {
      return { ok: false, error: "You can only assign Agent or Accountant" };
    }

    const supabase = createSupabaseServiceClient();

    if (isManagerLike(user.role)) {
      const { data: target } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", id)
        .single();
      if (target?.role === "admin") {
        return { ok: false, error: "Managers cannot edit admin accounts" };
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: updates.full_name,
        email: updates.email,
        phone: updates.phone || null,
        role: updates.role,
        brn: updates.brn || null,
        commission_rate: updates.commission_rate ?? null,
        is_active: updates.is_active,
        avatar_url: updates.avatar_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    await logActivity({
      actorId: user.id,
      entityType: "staff",
      entityId: id,
      action: "updated",
    });

    revalidatePath("/team");
    revalidatePath(`/team/${id}`);
    revalidatePath("/settings/users");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function sendPasswordResetLink(
  userId: string,
  email: string
): Promise<ActionResult<{ link: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!canManageCrm(user.role)) {
      return { ok: false, error: "Not authorized" };
    }

    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login?reset=true`,
      },
    });

    if (error) return { ok: false, error: error.message };

    await logActivity({
      actorId: user.id,
      entityType: "staff",
      entityId: userId,
      action: "password_reset_sent",
    });

    return { ok: true, data: { link: data.properties?.action_link ?? "" } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function setStaffPassword(
  userId: string,
  password: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!canManageCrm(user.role)) {
      return { ok: false, error: "Not authorized" };
    }

    if (password.length < 8) {
      return { ok: false, error: "Password must be at least 8 characters" };
    }

    const supabase = createSupabaseServiceClient();
    if (isManagerLike(user.role)) {
      const { data: target } = await supabase.from("profiles").select("role").eq("id", userId).single();
      if (target?.role === "admin") {
        return { ok: false, error: "Managers cannot change admin passwords" };
      }
    }

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });

    if (error) return { ok: false, error: error.message };

    await logActivity({
      actorId: user.id,
      entityType: "staff",
      entityId: userId,
      action: "password_set",
    });

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function createStaff(input: {
  email: string;
  fullName: string;
  role: string;
  phone?: string;
  password: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!canManageCrm(user.role)) {
      return { ok: false, error: "Not authorized" };
    }

    const email = input.email.trim().toLowerCase();
    const fullName = input.fullName.trim();
    const password = input.password;
    const roleParse = staffRoleSchema.safeParse(input.role);
    if (!email || !fullName) return { ok: false, error: "Name and email are required" };
    if (!roleParse.success) return { ok: false, error: "Invalid role" };
    if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters" };
    if (!canAssignRole(user.role, roleParse.data)) {
      return { ok: false, error: "You can only create Agent or Accountant accounts" };
    }

    const supabase = createSupabaseServiceClient();
    const role = roleParse.data as UserRole;
    let userId: string | null = null;

    const created = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });

    if (created.data.user) {
      userId = created.data.user.id;
    } else {
      const existingId = await findAuthUserIdByEmail(supabase, email);
      if (!existingId) {
        return { ok: false, error: created.error?.message ?? "Could not create login" };
      }
      userId = existingId;
      const updated = await supabase.auth.admin.updateUserById(existingId, {
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role },
      });
      if (updated.error) return { ok: false, error: updated.error.message };
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        role,
        phone: input.phone?.trim() || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (profileError) return { ok: false, error: profileError.message };

    await logActivity({
      actorId: user.id,
      entityType: "staff",
      entityId: userId,
      action: "created",
    });

    revalidatePath("/team");
    revalidatePath("/settings/users");
    return { ok: true, data: { id: userId } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/** @deprecated Use createStaff — kept so older UI calls still compile. */
export async function inviteStaff(
  email: string,
  fullName: string,
  role: string,
  phone?: string,
  password?: string
): Promise<ActionResult<{ id: string }>> {
  if (!password) {
    return { ok: false, error: "Set a password so this person can log in immediately" };
  }
  return createStaff({ email, fullName, role, phone, password });
}

export async function toggleStaffActive(
  userId: string,
  currentActive: boolean
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!canManageCrm(user.role)) {
      return { ok: false, error: "Not authorized" };
    }

    const supabase = createSupabaseServiceClient();

    if (isManagerLike(user.role)) {
      const { data: target } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      if (target?.role === "admin") {
        return { ok: false, error: "Managers cannot modify admin accounts" };
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !currentActive, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) return { ok: false, error: error.message };

    await logActivity({
      actorId: user.id,
      entityType: "staff",
      entityId: userId,
      action: !currentActive ? "activated" : "deactivated",
    });

    revalidatePath("/team");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

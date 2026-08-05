"use server";

import { z } from "zod";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

const updateProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1, "Name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional().nullable(),
  role: z.enum(["admin", "manager", "agent", "accountant"]),
  brn: z.string().optional().nullable(),
  commission_rate: z.number().min(0).max(100).optional().nullable(),
  is_active: z.boolean(),
  avatar_url: z.string().optional().nullable(),
});

export async function updateStaffProfile(
  input: z.infer<typeof updateProfileSchema>
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!["admin", "manager"].includes(user.role)) {
      return { ok: false, error: "Not authorized" };
    }

    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const { id, ...updates } = parsed.data;
    const supabase = await createSupabaseServerClient();

    // Managers can't edit admins
    if (user.role === "manager") {
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
    if (!["admin", "manager"].includes(user.role)) {
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
    if (!["admin", "manager"].includes(user.role)) {
      return { ok: false, error: "Not authorized" };
    }

    if (password.length < 8) {
      return { ok: false, error: "Password must be at least 8 characters" };
    }

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
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

export async function inviteStaff(
  email: string,
  fullName: string,
  role: string,
  phone?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!["admin", "manager"].includes(user.role)) {
      return { ok: false, error: "Not authorized" };
    }

    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`,
    });

    if (error) return { ok: false, error: error.message };
    if (!data.user) return { ok: false, error: "Failed to create user" };

    // Create profile
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      role,
      phone: phone || null,
      is_active: true,
    }, { onConflict: "id" });

    if (profileError) return { ok: false, error: profileError.message };

    await logActivity({
      actorId: user.id,
      entityType: "staff",
      entityId: data.user.id,
      action: "invited",
    });

    revalidatePath("/team");
    return { ok: true, data: { id: data.user.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function toggleStaffActive(
  userId: string,
  currentActive: boolean
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!["admin", "manager"].includes(user.role)) {
      return { ok: false, error: "Not authorized" };
    }

    const supabase = await createSupabaseServerClient();

    // Managers can't deactivate admins
    if (user.role === "manager") {
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

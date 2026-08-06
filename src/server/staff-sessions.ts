"use server";

import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export type ActionResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export async function startSession(): Promise<ActionResult<{ sessionId: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.rpc("upsert_staff_session", {
      p_user_id: user.id,
    });

    if (error) return { ok: false, error: error.message };

    return { ok: true, data: { sessionId: data as string } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function heartbeatSession(sessionId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.rpc("heartbeat_staff_session", {
      p_session_id: sessionId,
    });

    if (error) return { ok: false, error: error.message };

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function closeSession(sessionId: string): Promise<ActionResult> {
  try {
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.rpc("close_staff_session", {
      p_session_id: sessionId,
    });

    if (error) return { ok: false, error: error.message };

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export type StaffActivityStats = {
  daysLoggedInThisMonth: number;
  daysNotLoggedIn: number;
  totalActiveSecondsThisMonth: number;
  avgDailyActiveSeconds: number;
  lastLoginAt: string | null;
  sessions: Array<{
    id: string;
    session_date: string;
    login_at: string;
    logout_at: string | null;
    total_active_seconds: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    active_seconds: number;
    sessions: number;
  }>;
};

export async function getStaffActivityStats(
  userId: string,
  monthsBack = 1
): Promise<ActionResult<StaffActivityStats>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Unauthorized" };
    if (!["admin", "manager"].includes(user.role)) {
      return { ok: false, error: "Not authorized" };
    }

    const supabase = await createSupabaseServerClient();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);
    const monthStartStr = monthStart.toISOString().split("T")[0];

    // Get all sessions in the period
    const { data: sessions, error } = await supabase
      .from("staff_sessions")
      .select("*")
      .eq("user_id", userId)
      .gte("session_date", monthStartStr)
      .order("session_date", { ascending: false });

    if (error) return { ok: false, error: error.message };

    const allSessions = sessions ?? [];

    // Calculate days logged in this month
    const uniqueDates = new Set(allSessions.map((s) => s.session_date));
    const daysLoggedIn = uniqueDates.size;

    // Days in month so far (don't count future days)
    const today = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = Math.min(today, daysInMonth);
    const daysNotLoggedIn = daysElapsed - daysLoggedIn;

    // Total active time
    const totalActiveSeconds = allSessions.reduce((sum, s) => sum + (s.total_active_seconds ?? 0), 0);
    const avgDailyActiveSeconds = daysLoggedIn > 0 ? Math.round(totalActiveSeconds / daysLoggedIn) : 0;

    // Last login
    const lastLoginAt = allSessions.length > 0 ? allSessions[0].login_at : null;

    // Daily breakdown for chart
    const dailyMap: Record<string, { active_seconds: number; sessions: number }> = {};
    allSessions.forEach((s) => {
      if (!dailyMap[s.session_date]) {
        dailyMap[s.session_date] = { active_seconds: 0, sessions: 0 };
      }
      dailyMap[s.session_date].active_seconds += s.total_active_seconds ?? 0;
      dailyMap[s.session_date].sessions += 1;
    });

    const dailyBreakdown = Object.entries(dailyMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      ok: true,
      data: {
        daysLoggedInThisMonth: daysLoggedIn,
        daysNotLoggedIn: Math.max(0, daysNotLoggedIn),
        totalActiveSecondsThisMonth: totalActiveSeconds,
        avgDailyActiveSeconds,
        lastLoginAt,
        sessions: allSessions.slice(0, 30).map((s) => ({
          id: s.id,
          session_date: s.session_date,
          login_at: s.login_at,
          logout_at: s.logout_at,
          total_active_seconds: s.total_active_seconds ?? 0,
        })),
        dailyBreakdown,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

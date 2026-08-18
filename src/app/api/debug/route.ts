import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    results.env = {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
    };

    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    results.auth = {
      hasUser: !!user,
      userId: user?.id ?? null,
      error: authError?.message ?? null,
    };

    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      results.profile = {
        hasProfile: !!profile,
        error: profileError?.message ?? null,
        profileData: profile ? { id: profile.id, role: profile.role, is_active: profile.is_active } : null,
      };

      const { data: deals, error: dealsError } = await supabase
        .from("deals")
        .select("value")
        .is("deleted_at", null)
        .in("stage", ["new", "negotiations", "contract", "inquiry", "viewing", "offer", "negotiation"]);

      results.deals = {
        count: deals?.length ?? 0,
        error: dealsError?.message ?? null,
      };

      const { count: leadsCount, error: leadsError } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null);

      results.leads = {
        count: leadsCount ?? 0,
        error: leadsError?.message ?? null,
      };
    }

    return NextResponse.json(results, { status: 200 });
  } catch (err) {
    results.fatalError = err instanceof Error ? err.message : String(err);
    return NextResponse.json(results, { status: 500 });
  }
}

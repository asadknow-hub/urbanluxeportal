/**
 * Public marketing site runs without CRM / Supabase until an external CRM is wired.
 * Set FRONTEND_ONLY=0 (or NEXT_PUBLIC_FRONTEND_ONLY=0) to re-enable backend.
 */
export function isFrontendOnly(): boolean {
  const raw =
    process.env.NEXT_PUBLIC_FRONTEND_ONLY ?? process.env.FRONTEND_ONLY ?? "1";
  const v = raw.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

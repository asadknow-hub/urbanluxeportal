import { redirect } from "next/navigation";

export default async function ViewingsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; agent?: string; status?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.week) qs.set("week", params.week);
  if (params.agent) qs.set("agent", params.agent);
  const suffix = qs.toString();
  redirect(suffix ? `/leads/followups?${suffix}` : "/leads/followups");
}

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LeadsListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string; assigned?: string; q?: string; stage?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  query.set("view", "list");
  redirect(`/leads?${query.toString()}`);
}

import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LeadImportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "accountant") redirect("/leads");
  redirect("/settings/leads?tab=imports");
}

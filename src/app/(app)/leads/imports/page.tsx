import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LeadImportForm } from "@/components/leads/lead-import-form";

export const dynamic = "force-dynamic";

export default async function LeadImportsPage() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (user.role === "accountant") redirect("/leads");

  return <LeadImportForm />;
}

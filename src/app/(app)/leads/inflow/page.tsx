import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LeadsInflowPage() {
  redirect("/settings/leads?tab=fields");
}

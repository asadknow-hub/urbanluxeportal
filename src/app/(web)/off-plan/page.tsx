import type { Metadata } from "next";
import { ListingsPage } from "@/components/web/listings-page";

export const metadata: Metadata = {
  title: "Off-plan",
  description: "Forthcoming towers and lagoons in Dubai — payment plans on enquiry.",
};

export default function OffPlanPage() {
  return <ListingsPage kind="offplan" />;
}

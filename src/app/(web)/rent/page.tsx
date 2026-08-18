import type { Metadata } from "next";
import { ListingsPage } from "@/components/web/listings-page";

export const metadata: Metadata = {
  title: "Rent",
  description: "Annual homes to let in Dubai’s better buildings.",
};

export default function RentPage() {
  return <ListingsPage kind="rent" />;
}

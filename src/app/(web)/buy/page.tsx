import type { Metadata } from "next";
import { ListingsPage } from "@/components/web/listings-page";

export const metadata: Metadata = {
  title: "Buy",
  description: "Villas, penthouses, and apartments for sale in Dubai — released quietly.",
};

export default function BuyPage() {
  return <ListingsPage kind="sale" />;
}

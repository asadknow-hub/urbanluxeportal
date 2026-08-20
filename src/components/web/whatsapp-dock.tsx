"use client";

import { MessageCircle } from "lucide-react";
import { useBrand, useWaLink } from "@/components/brand/brand-provider";

export function WhatsAppDock() {
  const brand = useBrand();
  const href = useWaLink(`Hello ${brand.name} — I would like to enquire about a residence.`);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1E7A4A] text-white shadow-[0_12px_40px_rgba(11,29,61,0.25)] transition-transform duration-200 hover:scale-105"
      aria-label={`WhatsApp ${brand.name}`}
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}

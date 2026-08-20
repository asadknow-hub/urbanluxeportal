"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useBrand, useWaLink } from "@/components/brand/brand-provider";
import { cn } from "@/lib/utils";

export function WhatsAppDock() {
  const brand = useBrand();
  const pathname = usePathname();
  const href = useWaLink(`Hello ${brand.name} — I would like to enquire about a residence.`);
  const onProperty = pathname.startsWith("/properties/");

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1E7A4A] text-white shadow-[0_12px_40px_rgba(11,29,61,0.25)] transition-transform duration-200 hover:scale-105 max-lg:bottom-[max(1rem,var(--ul-safe-bottom))] lg:bottom-5 lg:right-5",
        onProperty && "max-lg:hidden"
      )}
      aria-label={`WhatsApp ${brand.name}`}
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}

"use client";

import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import { useBrand, useWaLink } from "@/components/brand/brand-provider";

export function PropertyMobileBar({
  title,
  community,
}: {
  title: string;
  community: string;
}) {
  const brand = useBrand();
  const wa = useWaLink(`Interested in ${title} in ${community}.`);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--ul-hair)] bg-[var(--ul-paper)]/95 px-3 pb-[calc(0.65rem+var(--ul-safe-bottom,0px))] pt-2.5 lg:hidden">
      <div className="mx-auto grid max-w-[1200px] grid-cols-3 gap-2">
        <a
          href={`tel:${brand.phoneTel}`}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-md border border-[#0A1630]/2 text-sm font-semibold text-[#0A1630]"
        >
          <Phone className="h-3.5 w-3.5" />
          Call
        </a>
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-md border border-[#25D366]/35 text-sm font-semibold text-[#0A1630]"
        >
          <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
          Chat
        </a>
        <Link
          href="#enquire"
          className="inline-flex h-11 items-center justify-center rounded-md bg-[#0A1630] text-sm font-semibold text-white"
        >
          Enquire
        </Link>
      </div>
    </div>
  );
}

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
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e4d9c8] bg-white/95 px-3 pb-[calc(0.65rem+var(--ul-safe-bottom,0px))] pt-2.5 backdrop-blur-md lg:hidden">
      <div className="mx-auto grid max-w-[1200px] grid-cols-3 gap-2">
        <a
          href={`tel:${brand.phoneTel}`}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-md border border-[#0B1D3D]/2 text-sm font-semibold text-[#0B1D3D]"
        >
          <Phone className="h-3.5 w-3.5" />
          Call
        </a>
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-md border border-[#25D366]/35 text-sm font-semibold text-[#0B1D3D]"
        >
          <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
          Chat
        </a>
        <Link
          href="#enquire"
          className="inline-flex h-11 items-center justify-center rounded-md bg-[#0B1D3D] text-sm font-semibold text-white"
        >
          Enquire
        </Link>
      </div>
    </div>
  );
}

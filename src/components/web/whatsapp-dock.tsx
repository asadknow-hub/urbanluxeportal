"use client";

import { usePathname } from "next/navigation";
import { useBrand, useWaLink } from "@/components/brand/brand-provider";
import { cn } from "@/lib/utils";

/** Phone + bubble mark only (no outer disc) so it sits clean on a green circle. */
function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M12.04 2C6.58 2 2.15 6.37 2.15 11.76c0 1.92.57 3.72 1.56 5.24L2 22l5.18-1.66a10.1 10.1 0 0 0 4.86 1.24h.01c5.46 0 9.89-4.37 9.89-9.76C21.94 6.37 17.5 2 12.04 2zm5.75 13.85c-.24.67-1.4 1.23-1.93 1.31-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.66-.61-2.92-1.26-4.82-4.2-4.97-4.39-.14-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.45.27-.29.59-.36.79-.36h.57c.18 0 .43-.07.67.51.24.6.82 2.07.89 2.22.07.15.12.32.02.51-.1.2-.15.32-.3.49-.14.17-.3.38-.43.51-.14.14-.29.29-.12.56.16.27.73 1.2 1.56 1.94 1.08.96 1.98 1.26 2.26 1.4.27.14.43.12.59-.07.16-.2.68-.79.86-1.06.18-.27.36-.22.61-.13.24.09 1.55.73 1.82.86.27.14.45.2.51.31.07.11.07.64-.17 1.31z"
      />
    </svg>
  );
}

export function WhatsAppDock() {
  const brand = useBrand();
  const pathname = usePathname();
  const href = useWaLink(`Hello ${brand.name}, I would like to enquire about a residence.`);
  const onProperty = pathname.startsWith("/properties/");

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "ul-wa-dock fixed right-4 z-40 inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(0,0,0,0.22)] max-lg:bottom-[max(1rem,var(--ul-safe-bottom))] lg:bottom-5 lg:right-5",
        onProperty && "max-lg:hidden"
      )}
      aria-label={`WhatsApp ${brand.name}`}
    >
      <WhatsAppGlyph className="block" />
    </a>
  );
}

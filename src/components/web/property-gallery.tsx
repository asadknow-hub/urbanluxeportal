"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function PropertyGallery({
  title,
  images,
}: {
  title: string;
  images: string[];
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden bg-[#1b2430] md:aspect-[16/8]">
        {current && (
          <Image
            src={current}
            alt={title}
            fill
            preload
            sizes="100vw"
            className="object-cover"
          />
        )}
      </div>
      {images.length > 1 && (
        <div className="ul-hide-scroll mt-3 flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden border",
                i === active ? "border-[#b0893a]" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Image src={src} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

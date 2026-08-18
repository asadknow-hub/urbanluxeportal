"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Listing } from "@/lib/web/listings";

export function PropertyGallery({ listing }: { listing: Listing }) {
  const images = listing.gallery.length ? listing.gallery : [listing.image];
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  function show(i: number) {
    setIndex(i);
    setOpen(true);
  }

  function prev() {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }

  function next() {
    setIndex((i) => (i + 1) % images.length);
  }

  const main = images[0];
  const sideA = images[1] ?? images[0];
  const sideB = images[2] ?? images[1] ?? images[0];
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${listing.community}, Dubai`)}`;

  return (
    <>
      <div className="grid gap-2.5 md:grid-cols-3 md:grid-rows-2 md:h-[28rem] lg:h-[32rem]">
        <div className="relative min-h-[16rem] overflow-hidden rounded-2xl md:col-span-2 md:row-span-2 md:min-h-0">
          <button type="button" onClick={() => show(0)} className="absolute inset-0" aria-label="Open photos">
            {main && (
              <Image src={main} alt={listing.title} fill preload sizes="(max-width: 768px) 100vw, 70vw" className="object-cover" />
            )}
          </button>
          {listing.exclusive && (
            <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-[#1b2430] px-3 py-1.5 text-[0.62rem] font-semibold tracking-[0.14em] uppercase text-[#2dd4bf]">
              Exclusive listing
            </span>
          )}
          <div className="absolute bottom-4 left-4 z-10 flex gap-2">
            <button
              type="button"
              onClick={() => show(0)}
              className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-[#14110e] shadow-sm"
            >
              <Camera className="h-3.5 w-3.5" />
              {images.length} photos
            </button>
            <a
              href={maps}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-[#14110e] shadow-sm hover:bg-white"
            >
              <MapPin className="h-3.5 w-3.5" />
              Map
            </a>
          </div>
        </div>
        <button
          type="button"
          onClick={() => show(Math.min(1, images.length - 1))}
          className="relative hidden overflow-hidden rounded-2xl md:block"
        >
          <Image src={sideA} alt="" fill sizes="30vw" className="object-cover" />
        </button>
        <button
          type="button"
          onClick={() => show(Math.min(2, images.length - 1))}
          className="relative hidden overflow-hidden rounded-2xl md:block"
        >
          <Image src={sideB} alt="" fill sizes="30vw" className="object-cover" />
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#14110e]/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
        >
          <button
            type="button"
            className="absolute right-5 top-5 text-[#f6f3ee]"
            aria-label="Close gallery"
            onClick={() => setOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
          <button type="button" className="absolute left-4 text-[#f6f3ee] md:left-8" aria-label="Previous" onClick={prev}>
            <ChevronLeft className="h-8 w-8" />
          </button>
          <div className="relative h-[70vh] w-full max-w-5xl">
            <Image src={images[index] ?? listing.image} alt="" fill className="object-contain" sizes="90vw" />
          </div>
          <button type="button" className="absolute right-4 text-[#f6f3ee] md:right-8" aria-label="Next" onClick={next}>
            <ChevronRight className="h-8 w-8" />
          </button>
          <p className="absolute bottom-6 text-sm text-[#f6f3ee]/70">
            {index + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  );
}

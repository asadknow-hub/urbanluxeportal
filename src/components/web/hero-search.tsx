"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { COMMUNITIES } from "@/lib/web/listings";
import { cn } from "@/lib/utils";

const INTENTS = [
  { id: "buy", label: "Buy", path: "/buy" },
  { id: "rent", label: "Rent", path: "/rent" },
  { id: "commercial", label: "Commercial", path: "/buy" },
  { id: "off-plan", label: "Off-plan", path: "/off-plan" },
] as const;

export function HeroSearch() {
  const router = useRouter();
  const [intent, setIntent] = useState<(typeof INTENTS)[number]["id"]>("buy");
  const [query, setQuery] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const path = INTENTS.find((i) => i.id === intent)?.path ?? "/buy";
    const params = new URLSearchParams();
    if (query) {
      const match = COMMUNITIES.find(
        (c) => c.slug === query || c.name.toLowerCase().includes(query.toLowerCase())
      );
      if (match) params.set("community", match.slug);
      else params.set("q", query);
    }
    const q = params.toString();
    router.push(q ? `${path}?${q}` : path);
  }

  return (
    <form onSubmit={submit} className="w-full max-w-3xl">
      <div className="mb-3 flex flex-wrap gap-4 px-1">
        {INTENTS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIntent(item.id)}
            className={cn(
              "text-sm font-medium transition-colors",
              intent === item.id
                ? "text-[#0B1D3D] underline decoration-[#1E7A4A] decoration-2 underline-offset-4"
                : "text-[#0B1D3D]/50 hover:text-[#0B1D3D]/80"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center overflow-hidden rounded-full bg-white shadow-[0_8px_40px_rgba(11,29,61,0.12)] ring-1 ring-[#0B1D3D]/8">
        <label className="sr-only" htmlFor="hero-location">
          Location
        </label>
        <input
          id="hero-location"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter location, area, or community…"
          className="h-14 min-w-0 flex-1 bg-transparent px-6 text-sm text-[#0B1D3D] outline-none placeholder:text-[#0B1D3D]/40"
        />
        <button
          type="submit"
          className="mr-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0B1D3D] text-white transition-colors hover:bg-[#0a172e]"
          aria-label="Search properties"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

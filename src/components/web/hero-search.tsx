"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { COMMUNITIES } from "@/lib/web/listings";
import { Search } from "lucide-react";

const INTENTS = [
  { id: "buy", label: "Buy", path: "/buy" },
  { id: "rent", label: "Rent", path: "/rent" },
  { id: "off-plan", label: "Off-plan", path: "/off-plan" },
] as const;

export function HeroSearch() {
  const router = useRouter();
  const [intent, setIntent] = useState<(typeof INTENTS)[number]["id"]>("buy");
  const [community, setCommunity] = useState("");
  const [beds, setBeds] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const path = INTENTS.find((i) => i.id === intent)?.path ?? "/buy";
    const params = new URLSearchParams();
    if (community) params.set("community", community);
    if (beds) params.set("beds", beds);
    const q = params.toString();
    router.push(q ? `${path}?${q}` : path);
  }

  return (
    <form
      onSubmit={submit}
      className="w-full border border-[#f6f3ee]/20 bg-[#14110e]/55 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-md md:p-4"
    >
      <div className="mb-3 flex gap-1 p-1">
        {INTENTS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIntent(item.id)}
            className={
              intent === item.id
                ? "flex-1 bg-[#b0893a] px-3 py-2 text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-[#14110e]"
                : "flex-1 px-3 py-2 text-[0.65rem] font-medium tracking-[0.22em] uppercase text-[#f6f3ee]/70 hover:text-[#f6f3ee]"
            }
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="grid gap-2 md:grid-cols-[1.4fr_1fr_auto]">
        <label className="sr-only" htmlFor="hero-community">
          Community
        </label>
        <select
          id="hero-community"
          value={community}
          onChange={(e) => setCommunity(e.target.value)}
          className="h-12 border border-[#f6f3ee]/15 bg-[#14110e]/40 px-4 text-sm text-[#f6f3ee] outline-none"
        >
          <option value="">Any community</option>
          {COMMUNITIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="hero-beds">
          Bedrooms
        </label>
        <select
          id="hero-beds"
          value={beds}
          onChange={(e) => setBeds(e.target.value)}
          className="h-12 border border-[#f6f3ee]/15 bg-[#14110e]/40 px-4 text-sm text-[#f6f3ee] outline-none"
        >
          <option value="">Any beds</option>
          <option value="1">1 bed</option>
          <option value="2">2 beds</option>
          <option value="3">3 beds</option>
          <option value="4">4+ beds</option>
        </select>
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center gap-2 bg-[#b0893a] px-8 text-[0.72rem] font-semibold tracking-[0.22em] uppercase text-[#14110e] transition-colors hover:bg-[#c49a4a]"
        >
          <Search className="h-4 w-4" />
          Search
        </button>
      </div>
    </form>
  );
}

"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function TopbarSearch() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onLeadsBoard = pathname === "/leads";
  const q = onLeadsBoard ? (searchParams.get("q") ?? "") : "";
  const extras = onLeadsBoard
    ? Array.from(searchParams.entries()).filter(([key]) => key !== "q")
    : ([["view", "board"]] as [string, string][]);

  return (
    <form action="/leads" method="get" className="relative hidden lg:block">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        name="q"
        defaultValue={q}
        key={`${pathname}-${searchParams.toString()}`}
        placeholder="Search leads"
        aria-label="Search leads"
        className="h-8 w-52 rounded-md border border-border bg-card pl-8 pr-2 text-sm text-foreground placeholder:text-muted-foreground"
      />
      {extras.map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
    </form>
  );
}

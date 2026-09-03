"use client";

import { cn } from "@/lib/utils";
import { FileText, FolderOpen, Home, Images } from "lucide-react";

export type PropertyPageView = "overview" | "photos" | "documents" | "owner";

const TABS: {
  id: PropertyPageView;
  label: string;
  icon: typeof Home;
  active: string;
  idle: string;
}[] = [
  {
    id: "overview",
    label: "Details",
    icon: Home,
    active: "bg-primary text-primary-foreground border-primary shadow-md",
    idle: "border-primary/25 bg-primary/8 text-primary hover:bg-primary/12",
  },
  {
    id: "photos",
    label: "Photos",
    icon: Images,
    active: "bg-sky-700 text-white border-sky-700 shadow-md",
    idle: "border-sky-700/25 bg-sky-700/8 text-sky-800 hover:bg-sky-700/12",
  },
  {
    id: "documents",
    label: "Documents",
    icon: FolderOpen,
    active: "bg-secondary text-secondary-foreground border-secondary shadow-md",
    idle: "border-secondary/30 bg-secondary/10 text-secondary hover:bg-secondary/15",
  },
  {
    id: "owner",
    label: "Owner",
    icon: FileText,
    active: "bg-[#0d2847] text-white border-[#0d2847] shadow-md",
    idle: "border-[#0d2847]/25 bg-[#0d2847]/8 text-[#0d2847] hover:bg-[#0d2847]/12",
  },
];

export function PropertyPageTabs({
  value,
  onChange,
}: {
  value: PropertyPageView;
  onChange: (view: PropertyPageView) => void;
}) {
  return (
    <nav aria-label="Property sections" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex h-[46px] items-center justify-center gap-2.5 rounded-[12px] border-2 px-4 text-[0.92rem] font-semibold transition-all",
              active ? tab.active : tab.idle
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { FileText, FolderOpen, UserRound } from "lucide-react";

export type LeadPageView = "overview" | "documents" | "kyc";

const TABS: {
  id: LeadPageView;
  label: string;
  icon: typeof UserRound;
  active: string;
  idle: string;
}[] = [
  {
    id: "overview",
    label: "Details",
    icon: UserRound,
    active: "bg-primary text-primary-foreground border-primary shadow-md",
    idle: "border-primary/25 bg-primary/8 text-primary hover:bg-primary/12",
  },
  {
    id: "documents",
    label: "Documents",
    icon: FolderOpen,
    active: "bg-secondary text-secondary-foreground border-secondary shadow-md",
    idle: "border-secondary/30 bg-secondary/10 text-secondary hover:bg-secondary/15",
  },
  {
    id: "kyc",
    label: "KYC",
    icon: FileText,
    active: "bg-[#0d2847] text-white border-[#0d2847] shadow-md",
    idle: "border-[#0d2847]/25 bg-[#0d2847]/8 text-[#0d2847] hover:bg-[#0d2847]/12",
  },
];

export function LeadPageTabs({
  value,
  onChange,
  kycDisabled,
}: {
  value: LeadPageView;
  onChange: (view: LeadPageView) => void;
  kycDisabled?: boolean;
}) {
  return (
    <nav
      aria-label="Lead sections"
      className="grid grid-cols-1 gap-2 sm:grid-cols-3"
    >
      {TABS.map((tab) => {
        const disabled = tab.id === "kyc" && kycDisabled;
        const Icon = tab.icon;
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex h-[46px] items-center justify-center gap-2.5 rounded-[12px] border-2 px-4 text-[0.92rem] font-semibold transition-all",
              active ? tab.active : tab.idle,
              disabled && "cursor-not-allowed opacity-40"
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

"use client";

import { cn } from "@/lib/utils";
import { FileText, FolderOpen, UserRound } from "lucide-react";

export type LeadPageView = "overview" | "documents" | "kyc";

const TABS: { id: LeadPageView; label: string; icon: typeof UserRound }[] = [
  { id: "overview", label: "Lead", icon: UserRound },
  { id: "documents", label: "Documents", icon: FolderOpen },
  { id: "kyc", label: "KYC", icon: FileText },
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
      className="flex flex-wrap gap-2 border-b border-border px-6 pb-0 pt-4 md:px-8"
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
              "inline-flex items-center gap-2 rounded-t-[10px] border border-b-0 px-4 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "border-border bg-card text-primary shadow-sm"
                : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              disabled && "cursor-not-allowed opacity-40"
            )}
          >
            <Icon className={cn("h-4 w-4", active ? "text-secondary" : "")} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

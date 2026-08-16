import { cn } from "@/lib/utils";
import { UsersRound, UserCheck, Filter } from "lucide-react";

function Sparkline({ className, path }: { className?: string; path: string }) {
  return (
    <svg className={cn("h-12 w-[150px] opacity-55", className)} viewBox="0 0 150 48" aria-hidden>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

const SPARKS = {
  gold: "M0 36 C15 30, 20 38, 32 25 S48 34, 58 20 S73 39, 83 10 S97 35, 108 17 S125 38, 150 12",
  teal: "M0 34 C12 35, 18 27, 28 31 S42 37, 53 20 S68 40, 77 8 S92 36, 105 15 S124 40, 150 17",
  purple: "M0 35 C13 30, 21 36, 31 24 S47 38, 57 19 S72 38, 81 12 S97 39, 110 20 S130 37, 150 16",
} as const;

export function StaffStats({
  total,
  active,
  agents,
  showing,
  showingHint,
}: {
  total: number;
  active: number;
  agents: number;
  showing: number;
  showingHint: string;
}) {
  const cards = [
    {
      label: "Roster",
      value: total,
      sub: `${active} active member${active === 1 ? "" : "s"}`,
      icon: UsersRound,
      iconClass: "bg-[#f6f0e3] text-[#b98a28]",
      sparkClass: "text-[#d7ad54]",
      spark: SPARKS.gold,
    },
    {
      label: "Active agents",
      value: agents,
      sub: "Online and active",
      icon: UserCheck,
      iconClass: "bg-[#e5f2f0] text-[#298b83]",
      sparkClass: "text-[#67bbb5]",
      spark: SPARKS.teal,
    },
    {
      label: "Showing",
      value: showing,
      sub: showingHint,
      icon: Filter,
      iconClass: "bg-[#eee9f8] text-[#6550ae]",
      sparkClass: "text-[#aa96df]",
      spark: SPARKS.purple,
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="flex min-h-[126px] items-center justify-between overflow-hidden rounded-[18px] border border-[#e9e5dc] bg-card p-5 sm:p-6"
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full",
                  card.iconClass
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="mb-1.5 text-[13px] text-[#85827d]">{card.label}</p>
                <p
                  className="font-[family-name:var(--font-display)] text-[29px] leading-none tracking-tight text-foreground"
                >
                  {card.value}
                </p>
                <p className="mt-1.5 text-xs text-[#999690]">{card.sub}</p>
              </div>
            </div>
            <Sparkline className={cn("hidden sm:block", card.sparkClass)} path={card.spark} />
          </div>
        );
      })}
    </div>
  );
}

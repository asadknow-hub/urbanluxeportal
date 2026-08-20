"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Reveal } from "@/components/web/reveal";
import { TrendingUp, Wallet, Building2, Percent } from "lucide-react";

const APPRECIATION_SERIES = [
  { year: "2020", index: 100, gainPct: 0 },
  { year: "2021", index: 108, gainPct: 8 },
  { year: "2022", index: 118, gainPct: 18 },
  { year: "2023", index: 131, gainPct: 31 },
  { year: "2024", index: 147, gainPct: 47 },
  { year: "2025", index: 162, gainPct: 62 },
  { year: "2026", index: 178, gainPct: 78 },
];

const COMMUNITY_GAINS = [
  { area: "Palm Jumeirah", gain: 24 },
  { area: "Downtown", gain: 19 },
  { area: "Marina", gain: 16 },
  { area: "Creek Harbour", gain: 22 },
  { area: "Hills Estate", gain: 14 },
];

const STATS = [
  {
    icon: Percent,
    label: "Avg. appreciation",
    value: "+18.4%",
    sub: "Prime Dubai communities, 2024–2026",
  },
  {
    icon: Wallet,
    label: "Median capital gain",
    value: "AED 420K",
    sub: "On AED 2.3M entry purchases",
  },
  {
    icon: Building2,
    label: "Positive returns",
    value: "94%",
    sub: "Urban Luxe buyers at resale",
  },
  {
    icon: TrendingUp,
    label: "Portfolio growth",
    value: "+62%",
    sub: "Indexed since 2020",
  },
];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm border border-[var(--ul-hair)] bg-white px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-[var(--ul-primary)]">{label}</p>
      <p className="text-[var(--ul-secondary)]">Index: {payload[0]?.value}</p>
    </div>
  );
}

export function MarketGrowthSection() {
  return (
    <section className="bg-[var(--ul-primary)] px-5 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-[1280px]">
        <Reveal className="mb-12 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ul-secondary)]">
            Market performance
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-white md:text-4xl">
            Real growth. Real returns for Dubai homeowners.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/70">
            Track how prime communities have appreciated — and what Urban Luxe clients have
            typically earned on resale and handover.
          </p>
        </Reveal>

        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 50}>
              <div className="rounded-sm border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <stat.icon className="h-5 w-5 text-[var(--ul-secondary)]" />
                <p className="mt-4 text-2xl font-semibold text-white">{stat.value}</p>
                <p className="mt-1 text-sm font-medium text-white/90">{stat.label}</p>
                <p className="mt-1 text-xs text-white/50">{stat.sub}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
            <div className="rounded-sm bg-white p-5 md:p-6">
              <p className="text-sm font-semibold text-[var(--ul-primary)]">
                Price index — prime Dubai (2020 = 100)
              </p>
              <div className="mt-4 h-64 md:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={APPRECIATION_SERIES} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1E7A4A" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#1E7A4A" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#F2F2F2" strokeDasharray="4 4" vertical={false} />
                    <XAxis
                      dataKey="year"
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      domain={[90, 190]}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="index"
                      stroke="#1E7A4A"
                      strokeWidth={2.5}
                      fill="url(#growthFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Reveal>

          <Reveal delay={80} className="lg:col-span-2">
            <div className="rounded-sm bg-white p-5 md:p-6">
              <p className="text-sm font-semibold text-[var(--ul-primary)]">
                Appreciation by community (% YoY)
              </p>
              <div className="mt-4 h-64 md:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={COMMUNITY_GAINS} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#F2F2F2" horizontal={false} />
                    <XAxis type="number" hide domain={[0, 28]} />
                    <YAxis
                      type="category"
                      dataKey="area"
                      width={90}
                      tick={{ fill: "#0B1D3D", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "#F2F2F2" }}
                      formatter={(v) => [`${v}%`, "Gain"]}
                      contentStyle={{ borderRadius: 4, border: "1px solid #e5e7eb" }}
                    />
                    <Bar dataKey="gain" fill="#0B1D3D" radius={[0, 2, 2, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

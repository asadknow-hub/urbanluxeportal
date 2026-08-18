export const DEAL_PIPELINE_STAGES = [
  { key: "new", label: "New", color: "bg-blue-500", grad: "from-blue-500 to-blue-600", weight: 0.2 },
  { key: "negotiations", label: "Negotiations", color: "bg-amber-500", grad: "from-amber-500 to-amber-600", weight: 0.45 },
  { key: "contract", label: "Contract", color: "bg-indigo-500", grad: "from-indigo-500 to-indigo-600", weight: 0.8 },
  { key: "closed", label: "Closed", color: "bg-emerald-500", grad: "from-emerald-500 to-emerald-600", weight: 1 },
] as const;

export const DEAL_LOST_STAGE = {
  key: "lost",
  label: "Lost",
  color: "bg-red-500",
  grad: "from-red-500 to-red-600",
  weight: 0,
} as const;

export const DEAL_BOARD_STAGES = [...DEAL_PIPELINE_STAGES, DEAL_LOST_STAGE] as const;

export type DealPipelineStage = (typeof DEAL_PIPELINE_STAGES)[number]["key"];
export type DealBoardStage = (typeof DEAL_BOARD_STAGES)[number]["key"];

const LEGACY: Record<string, DealBoardStage> = {
  inquiry: "new",
  viewing: "new",
  negotiation: "negotiations",
  offer: "negotiations",
  won: "closed",
};

export function normalizeDealStage(stage: string | null | undefined): DealBoardStage {
  if (!stage) return "new";
  if (stage in LEGACY) return LEGACY[stage];
  if (DEAL_BOARD_STAGES.some((s) => s.key === stage)) return stage as DealBoardStage;
  return "new";
}

export function dealStageLabel(stage: string | null | undefined) {
  const key = normalizeDealStage(stage);
  return DEAL_BOARD_STAGES.find((s) => s.key === key)?.label ?? key;
}

export function isDealClosed(stage: string | null | undefined) {
  const key = normalizeDealStage(stage);
  return key === "closed";
}

export function isDealLost(stage: string | null | undefined) {
  return normalizeDealStage(stage) === "lost";
}

export function isDealOpen(stage: string | null | undefined) {
  return !isDealClosed(stage) && !isDealLost(stage);
}

export const OPEN_DEAL_STAGE_KEYS = DEAL_PIPELINE_STAGES.filter((s) => s.key !== "closed").map((s) => s.key);

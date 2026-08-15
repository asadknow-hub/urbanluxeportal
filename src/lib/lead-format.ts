const INTEREST_LABELS: Record<string, string> = {
  buy: "Buy",
  rent: "Rent",
  sell: "Sell",
  off_plan: "Off Plan",
  commercial: "Commercial",
};

export function formatLeadInterest(value: string) {
  return INTEREST_LABELS[value] ?? value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function leadInterestPillClass(value: string | null | undefined): string {
  switch (value) {
    case "buy":
      return "bg-blue-600 text-white";
    case "rent":
      return "bg-teal-600 text-white";
    case "sell":
      return "bg-amber-600 text-white";
    case "off_plan":
      return "bg-violet-600 text-white";
    case "commercial":
      return "bg-slate-800 text-white";
    default:
      return "bg-secondary text-secondary-foreground";
  }
}

export function formatLeadTag(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

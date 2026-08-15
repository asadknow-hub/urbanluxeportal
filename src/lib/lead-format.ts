export const DUBAI_AREAS = [
  "Abu Hail",
  "Al Barari",
  "Al Barsha",
  "Al Barsha 1",
  "Al Barsha 2",
  "Al Barsha 3",
  "Al Badaa",
  "Al Garhoud",
  "Al Jaddaf",
  "Al Khabisi",
  "Al Khawaneej",
  "Al Mizhar",
  "Al Nahda",
  "Al Quoz",
  "Al Quoz 1",
  "Al Quoz 2",
  "Al Quoz 3",
  "Al Quoz 4",
  "Al Qusais",
  "Al Qusais 1",
  "Al Qusais 2",
  "Al Qusais 3",
  "Al Qusais 4",
  "Al Satwa",
  "Arjan",
  "Barsha Heights",
  "Business Bay",
  "City Walk",
  "DAMAC Hills",
  "Discovery Gardens",
  "Downtown Dubai",
  "Dubai Hills Estate",
  "Dubai International City",
  "Dubai Investment Park",
  "Dubai Marina",
  "Dubai Silicon Oasis",
  "Dubai Sports City",
  "Emirates Hills",
  "Falcon City of Wonders",
  "Jebel Ali",
  "Jumeirah",
  "Jumeirah 1",
  "Jumeirah 2",
  "Jumeirah 3",
  "Jumeirah Beach Residence",
  "Jumeirah Golf Estates",
  "Jumeirah Islands",
  "Jumeirah Lake Towers",
  "Jumeirah Park",
  "Jumeirah Village Circle",
  "Jumeirah Village Triangle",
  "Liwan",
  "Meydan",
  "Mirdif",
  "Mohammed Bin Rashid City",
  "Motor City",
  "Nad Al Hamar",
  "Nad Al Sheba",
  "Palm Jumeirah",
  "Production City",
  "Ras Al Khor",
  "Remraam",
  "Silicon Oasis",
  "The Greens",
  "The Lagoons",
  "The Lakes",
  "The Meadows",
  "The Springs",
  "The Villa",
  "Town Square",
  "Umm Al Sheif",
  "Umm Suqeim",
  "World Trade Centre",
  "Yasmin Village",
] as const;

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

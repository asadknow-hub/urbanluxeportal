import { daysSince } from "@/lib/dates";

export function stageSlaClock(
  enteredAt: string | null | undefined,
  staleAfterDays: number | null | undefined
) {
  if (!staleAfterDays || staleAfterDays <= 0 || !enteredAt) return null;
  const elapsed = Math.max(0, daysSince(enteredAt));
  const dayNum = elapsed + 1;
  return {
    dayNum,
    sla: staleAfterDays,
    overdue: dayNum > staleAfterDays,
  };
}

import { format, formatDistanceToNow, differenceInDays } from "date-fns";

export const DUBAI_TIMEZONE = "Asia/Dubai";

export function formatDate(
  date: Date | string | null | undefined,
  fmt: string = "dd MMM yyyy"
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, fmt);
}

export function formatDateTime(
  date: Date | string | null | undefined
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy, HH:mm");
}

export function shortTimeAgo(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const mins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return format(d, "dd MMM");
}

export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function daysUntil(date: Date | string | null | undefined): number {
  if (!date) return Infinity;
  const d = typeof date === "string" ? new Date(date) : date;
  return differenceInDays(d, new Date());
}

export function daysSince(date: Date | string | null | undefined): number {
  if (!date) return Infinity;
  const d = typeof date === "string" ? new Date(date) : date;
  return differenceInDays(new Date(), d);
}

export function isOverdue(date: Date | string | null | undefined): boolean {
  return daysUntil(date) < 0;
}

export function isExpiringSoon(
  date: Date | string | null | undefined,
  days: number = 30
): boolean {
  const d = daysUntil(date);
  return d >= 0 && d <= days;
}

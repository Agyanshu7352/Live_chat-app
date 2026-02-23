import { format, isToday, isThisYear, isYesterday } from "date-fns";

export function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);

  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return `Yesterday, ${format(date, "h:mm a")}`;
  if (isThisYear(date)) return format(date, "MMM d, h:mm a");
  return format(date, "MMM d yyyy, h:mm a");
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);

  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  if (isThisYear(date)) return format(date, "MMM d");
  return format(date, "MMM d, yyyy");
}

export function formatHeaderTimestamp(timestamp: number): string {
  const date = new Date(timestamp);

  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisYear(date)) return format(date, "MMMM d");
  return format(date, "MMMM d, yyyy");
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
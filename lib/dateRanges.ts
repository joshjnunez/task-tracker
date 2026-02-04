import type { Task } from "@/lib/types";

function chicagoYmdParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: "year" | "month" | "day") => {
    const v = parts.find((p) => p.type === type)?.value;
    if (!v) throw new Error(`Missing ${type} in Chicago date parts`);
    return Number(v);
  };

  return { year: get("year"), month: get("month"), day: get("day") };
}

function ymdFromUtcDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function utcDateFromYmd(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

export function getChicagoTodayYMD(now: Date = new Date()): string {
  const { year, month, day } = chicagoYmdParts(now);
  return ymdFromUtcDate(utcDateFromYmd(year, month, day));
}

export function getChicagoWeekRange(now: Date = new Date()): { start: string; end: string } {
  const { year, month, day } = chicagoYmdParts(now);
  const todayUtc = utcDateFromYmd(year, month, day);

  const weekday = todayUtc.getUTCDay();
  const daysSinceMonday = (weekday + 6) % 7;
  const startUtc = new Date(todayUtc.getTime() - daysSinceMonday * 86400000);
  const endUtc = new Date(startUtc.getTime() + 7 * 86400000);

  return {
    start: ymdFromUtcDate(startUtc),
    end: ymdFromUtcDate(endUtc),
  };
}

export function isDueThisWeek(task: Pick<Task, "dueDate">, now: Date = new Date()): boolean {
  if (!task.dueDate) return false;
  const { start, end } = getChicagoWeekRange(now);
  return task.dueDate >= start && task.dueDate < end;
}

export function isOverdue(task: Pick<Task, "dueDate" | "status">, now: Date = new Date()): boolean {
  if (!task.dueDate) return false;
  if (task.status === "DONE") return false;
  const today = getChicagoTodayYMD(now);
  return task.dueDate < today;
}

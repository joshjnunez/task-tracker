"use client";

import React, { useMemo } from "react";
import type { Task } from "@/lib/types";
import { isOverdue } from "@/lib/dateRanges";
import { resolveAEColor } from "@/lib/aeColors";

type AESummary = {
  name: string;
  color: string;
  open: number;
  overdue: number;
  done: number;
};

export function AESummaryBar({
  tasks,
  aes,
  aeColors,
  activeAE,
  onSelectAE,
}: {
  tasks: Task[];
  aes: string[];
  aeColors: Record<string, string>;
  activeAE: string;
  onSelectAE: (ae: string) => void;
}) {
  const summaries = useMemo(() => {
    const map = new Map<string, { open: number; overdue: number; done: number }>();
    for (const ae of aes) {
      map.set(ae, { open: 0, overdue: 0, done: 0 });
    }

    for (const t of tasks) {
      if (!t.ae) continue;
      let entry = map.get(t.ae);
      if (!entry) {
        entry = { open: 0, overdue: 0, done: 0 };
        map.set(t.ae, entry);
      }
      if (t.status === "DONE") {
        entry.done++;
      } else {
        entry.open++;
        if (isOverdue(t)) entry.overdue++;
      }
    }

    const result: AESummary[] = [];
    for (const [name, counts] of map) {
      result.push({
        name,
        color: resolveAEColor(name, aeColors[name]),
        ...counts,
      });
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks, aes, aeColors]);

  if (summaries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {summaries.map((s) => {
        const isActive = activeAE === s.name;
        return (
          <button
            key={s.name}
            type="button"
            onClick={() => onSelectAE(isActive ? "ALL" : s.name)}
            className={
              "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition " +
              (isActive
                ? "border-zinc-900 ring-1 ring-zinc-900"
                : "border-zinc-200 hover:border-zinc-300")
            }
          >
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-2 py-0.5 text-xs font-semibold text-zinc-800"
              style={{ backgroundColor: s.color }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-black/30" aria-hidden="true" />
              {s.name}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span>{s.open} open</span>
              {s.overdue > 0 && (
                <span className="font-semibold text-red-600">{s.overdue} overdue</span>
              )}
              <span>{s.done} done</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

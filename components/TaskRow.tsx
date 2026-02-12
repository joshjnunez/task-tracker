"use client";

import React from "react";
import type { Task, TaskStatus } from "@/lib/types";
import { getAllStatuses, getStatusLabel } from "@/lib/taskLogic";
import { resolveAEColor } from "@/lib/aeColors";
import { formatAccountName, isMissingAccount } from "@/lib/formatters";
import { InProgressFire } from "@/components/InProgressFire";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700">
      {children}
    </span>
  );
}

function formatDueDate(dueDate?: string): string {
  if (!dueDate) return "–";
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(dueDate);
  if (!m) return dueDate;
  const [, yyyy, mm, dd] = m;
  return `${mm}/${dd}/${yyyy}`;
}

function AEPill({ name, color }: { name: string; color?: string }) {
  const bg = resolveAEColor(name, color);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-2.5 py-1 text-xs font-medium text-zinc-800"
      style={{ backgroundColor: bg }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-black/30" aria-hidden="true" />
      {name}
    </span>
  );
}

export function TaskRow({
  task,
  onEdit,
  onToggleToday,
  onStatusChange,
  aeColor,
  inToday,
  expanded,
  onToggleExpand,
  expandDisabled,
  gridTemplateColumns,
}: {
  task: Task;
  onEdit: () => void;
  onToggleToday: () => void;
  onStatusChange: (status: TaskStatus) => void;
  aeColor?: string;
  inToday?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  expandDisabled?: boolean;
  gridTemplateColumns?: string;
}) {
  const statuses = getAllStatuses();

  return (
    <div
      onDoubleClick={onEdit}
      className="grid cursor-pointer items-center gap-3 border-t border-zinc-100 px-4 py-3 text-sm hover:bg-zinc-50"
      style={{
        gridTemplateColumns:
          gridTemplateColumns ?? "minmax(26ch, 1fr) 8ch 14ch 14ch 14ch 3ch",
      }}
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand?.();
            }}
            disabled={expandDisabled || !onToggleExpand}
            aria-label={expanded ? "Collapse" : "Expand"}
            aria-expanded={expanded}
            className={
              "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-500"
            }
          >
            <span
              className={
                "text-xs transition-transform duration-150 " + (expanded ? "rotate-90" : "rotate-0")
              }
            >
              ▶
            </span>
          </button>

          <div className="min-w-0 truncate text-sm font-semibold text-zinc-900">
            <InProgressFire status={task.status} />
            {task.title}
          </div>
        </div>
      </div>

      <div className="min-w-0 flex items-center gap-2 pr-4">
        <AEPill name={task.ae} color={aeColor} />
      </div>
      <div className="min-w-0 flex items-center gap-2 pl-4">
        {isMissingAccount(task.account) ? (
          <span className="text-sm text-zinc-500">{formatAccountName(task.account)}</span>
        ) : (
          <Pill>{formatAccountName(task.account)}</Pill>
        )}
      </div>

      <div className="min-w-0 text-sm font-medium text-zinc-700">
        {formatDueDate(task.dueDate)}
      </div>

      <div className="min-w-0">
        <select
          value={task.status}
          onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-900 outline-none focus:border-zinc-400"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {getStatusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-0 flex items-center justify-end">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleToday();
          }}
          onDoubleClick={(e) => e.stopPropagation()}
          aria-pressed={inToday}
          aria-label={inToday ? "Remove from Today" : "Add to Today"}
          title="Today"
          className={
            "inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors hover:bg-zinc-50 " +
            (inToday ? "border-zinc-900" : "border-zinc-200")
          }
        >
          <span
            aria-hidden="true"
            className={
              "h-2 w-2 rounded-full transition-colors " +
              (inToday ? "bg-zinc-900" : "bg-transparent")
            }
          />
        </button>
      </div>
    </div>
  );
}

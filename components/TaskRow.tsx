"use client";

import React from "react";
import type { Task, TaskStatus } from "@/lib/types";
import { getAllStatuses, getStatusLabel } from "@/lib/taskLogic";
import { resolveAEColor } from "@/lib/aeColors";
import { formatAccountName, isMissingAccount } from "@/lib/formatters";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700">
      {children}
    </span>
  );
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
  onDelete,
  onStatusChange,
  onDueDateChange,
  aeColor,
  expanded,
  onToggleExpand,
  expandDisabled,
  gridTemplateColumns,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onDueDateChange: (dueDate: string) => void;
  aeColor?: string;
  expanded?: boolean;
  onToggleExpand?: () => void;
  expandDisabled?: boolean;
  gridTemplateColumns?: string;
}) {
  const statuses = getAllStatuses();

  return (
    <div
      className="grid items-center gap-3 border-t border-zinc-100 px-4 py-3 text-sm"
      style={{
        gridTemplateColumns:
          gridTemplateColumns ?? "minmax(26ch, 1fr) 8ch 14ch 14ch 14ch 18ch",
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

          <div className="min-w-0 truncate text-sm font-semibold text-zinc-900">{task.title}</div>
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

      <div className="min-w-0">
        <input
          type="date"
          value={task.dueDate ?? ""}
          onChange={(e) => onDueDateChange(e.target.value)}
          className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
        />
      </div>

      <div className="min-w-0">
        <select
          value={task.status}
          onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
          className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {getStatusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-0 flex justify-end gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="h-9 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

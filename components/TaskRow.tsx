"use client";

import React from "react";
import type { Task, TaskStatus } from "@/lib/types";
import { getAllStatuses, getStatusLabel } from "@/lib/taskLogic";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700">
      {children}
    </span>
  );
}

export function TaskRow({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onDueDateChange,
  gridTemplateColumns,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onDueDateChange: (dueDate: string) => void;
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
        <div className="truncate text-sm font-semibold text-zinc-900">
          {task.title}
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          Created {new Date(task.createdAt).toLocaleDateString()}
        </div>
      </div>

      <div className="min-w-0 flex items-center gap-2">
        <Pill>{task.ae}</Pill>
      </div>
      <div className="min-w-0 flex items-center gap-2">
        <Pill>{task.account}</Pill>
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

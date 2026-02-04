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

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onDueDateChange,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onDueDateChange: (dueDate: string) => void;
}) {
  const statuses = getAllStatuses();

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-zinc-900">
            {task.title}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Pill>{task.ae}</Pill>
            <Pill>{task.account}</Pill>
            {task.dueDate ? <Pill>Due {task.dueDate}</Pill> : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="h-10 rounded-xl border border-red-200 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {task.description ? (
        <div className="mt-3 text-sm text-zinc-600">{task.description}</div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label>
          <div className="text-xs font-medium text-zinc-600">Status</div>
          <select
            value={task.status}
            onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
            className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {getStatusLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div className="text-xs font-medium text-zinc-600">Due date</div>
          <input
            type="date"
            value={task.dueDate ?? ""}
            onChange={(e) => onDueDateChange(e.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
          />
        </label>
      </div>

      <div className="mt-4 text-xs text-zinc-500">
        Created {new Date(task.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}

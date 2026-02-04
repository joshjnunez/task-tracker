"use client";

import React from "react";
import type { Task, TaskStatus } from "@/lib/types";
import { getStatusLabel } from "@/lib/taskLogic";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700">
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700">
      {getStatusLabel(status)}
    </span>
  );
}

export function MobileTaskCard({ task }: { task: Task }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-base font-semibold leading-snug text-zinc-900">{task.title}</div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Pill>{task.ae}</Pill>
        <Pill>{task.account}</Pill>
        <StatusBadge status={task.status} />
        {task.dueDate ? <Pill>Due {task.dueDate}</Pill> : null}
      </div>

      {task.description ? (
        <div className="mt-3 whitespace-pre-wrap text-sm text-zinc-600">{task.description}</div>
      ) : null}
    </div>
  );
}

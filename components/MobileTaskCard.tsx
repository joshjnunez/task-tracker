"use client";

import React from "react";
import type { Task, TaskStatus } from "@/lib/types";
import { getStatusLabel } from "@/lib/taskLogic";
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

function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700">
      {getStatusLabel(status)}
    </span>
  );
}

export function MobileTaskCard({ task, aeColor }: { task: Task; aeColor?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-base font-semibold leading-snug text-zinc-900">{task.title}</div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <AEPill name={task.ae} color={aeColor} />
        {isMissingAccount(task.account) ? (
          <span className="px-1 text-xs font-medium text-zinc-500">{formatAccountName(task.account)}</span>
        ) : (
          <Pill>{formatAccountName(task.account)}</Pill>
        )}
        <StatusBadge status={task.status} />
        {task.dueDate ? <Pill>Due {task.dueDate}</Pill> : null}
      </div>

      {task.description ? (
        <div className="mt-3 whitespace-pre-wrap text-sm text-zinc-600">{task.description}</div>
      ) : null}
    </div>
  );
}

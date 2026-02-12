"use client";

import React, { useMemo } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useAppData } from "@/components/AppDataProvider";
import { resolveAEColor } from "@/lib/aeColors";
import { formatAccountName, isMissingAccount } from "@/lib/formatters";
import { useTodayTaskIds } from "@/lib/useTodayTaskIds";
import type { Task } from "@/lib/types";

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

function TodayTaskCard({
  task,
  aeColor,
  onRemove,
}: {
  task: Task;
  aeColor?: string;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-zinc-900">
            {task.title}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <AEPill name={task.ae} color={aeColor} />
            {isMissingAccount(task.account) ? (
              <span className="px-1 text-xs font-medium text-zinc-500">{formatAccountName(task.account)}</span>
            ) : (
              <Pill>{formatAccountName(task.account)}</Pill>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="h-9 shrink-0 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default function TodayTodoListPage() {
  const { tasks, aeColors } = useAppData();
  const { taskIds, remove } = useTodayTaskIds();

  const taskById = useMemo(() => {
    const map = new Map<string, Task>();
    for (const t of tasks) map.set(t.id, t);
    return map;
  }, [tasks]);

  const todayTasks = useMemo(() => {
    return taskIds.map((id) => taskById.get(id)).filter(Boolean) as Task[];
  }, [taskIds, taskById]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <AppHeader subtitle="Today’s To-Do List" />

        <div className="mt-5">
          {todayTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-600">
              <div className="text-base font-semibold text-zinc-900">No tasks in Today yet</div>
              <div className="mt-1">Add tasks from the main list using the Today toggle.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.map((t) => (
                <TodayTaskCard
                  key={t.id}
                  task={t}
                  aeColor={aeColors?.[t.ae]}
                  onRemove={() => remove(t.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useMemo, useState } from "react";
import type { Task, TaskStatus } from "@/lib/types";
import { TaskCard } from "@/components/TaskCard";
import { TaskRow } from "@/components/TaskRow";

export function TaskList({
  active,
  completed,
  onEdit,
  onDelete,
  onStatusChange,
  onDueDateChange,
}: {
  active: Task[];
  completed: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onDueDateChange: (task: Task, dueDate: string) => void;
}) {
  const [showCompleted, setShowCompleted] = useState(false);

  const desktopGridTemplate = "minmax(26ch, 1fr) 8ch 20ch 16ch 14ch 18ch";

  const hasAny = active.length + completed.length > 0;

  const emptyState = useMemo(() => {
    if (hasAny && active.length === 0) {
      return {
        title: "No matching active tasks",
        detail: "Try clearing filters or create a new task.",
      };
    }

    if (!hasAny) {
      return {
        title: "No tasks yet",
        detail: "Create your first task to get started.",
      };
    }

    return null;
  }, [active.length, hasAny]);

  return (
    <div className="space-y-4">
      {emptyState ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-600">
          <div className="text-base font-semibold text-zinc-900">
            {emptyState.title}
          </div>
          <div className="mt-1">{emptyState.detail}</div>
        </div>
      ) : null}

      <div className="sm:hidden">
        <div className="space-y-3">
          {active.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onEdit={() => onEdit(t)}
              onDelete={() => onDelete(t)}
              onStatusChange={(s) => onStatusChange(t, s)}
              onDueDateChange={(d) => onDueDateChange(t, d)}
            />
          ))}
        </div>
      </div>

      <div className="hidden sm:block">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div
            className="grid items-center gap-3 px-4 py-3 text-sm text-zinc-600"
            style={{ gridTemplateColumns: desktopGridTemplate }}
          >
            <div className="min-w-0 text-xs font-medium">Task</div>
            <div className="min-w-0 text-xs font-medium">AE</div>
            <div className="min-w-0 text-xs font-medium">Account</div>
            <div className="min-w-0 text-xs font-medium">Due</div>
            <div className="min-w-0 text-xs font-medium">Status</div>
            <div className="min-w-0 text-right text-xs font-medium">Actions</div>
          </div>
          {active.length === 0 ? (
            <div className="border-t border-zinc-100 px-4 py-6 text-sm text-zinc-600">
              No active tasks.
            </div>
          ) : (
            active.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                gridTemplateColumns={desktopGridTemplate}
                onEdit={() => onEdit(t)}
                onDelete={() => onDelete(t)}
                onStatusChange={(s) => onStatusChange(t, s)}
                onDueDateChange={(d) => onDueDateChange(t, d)}
              />
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left"
          onClick={() => setShowCompleted((v) => !v)}
          aria-expanded={showCompleted}
        >
          <div>
            <div className="text-sm font-semibold text-zinc-900">
              Completed
            </div>
            <div className="text-xs text-zinc-500">{completed.length} tasks</div>
          </div>
          <div className="text-sm text-zinc-500">
            {showCompleted ? "Hide" : "Show"}
          </div>
        </button>

        {showCompleted ? (
          <div className="border-t border-zinc-100 p-4">
            {completed.length === 0 ? (
              <div className="text-sm text-zinc-600">
                No completed tasks.
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-2">
                {completed.map((t) => (
                  <div key={t.id} className="sm:hidden">
                    <TaskCard
                      task={t}
                      onEdit={() => onEdit(t)}
                      onDelete={() => onDelete(t)}
                      onStatusChange={(s) => onStatusChange(t, s)}
                      onDueDateChange={(d) => onDueDateChange(t, d)}
                    />
                  </div>
                ))}
                <div className="hidden sm:block">
                  <div className="overflow-hidden rounded-2xl border border-zinc-200">
                    {completed.map((t) => (
                      <TaskRow
                        key={t.id}
                        task={t}
                        gridTemplateColumns={desktopGridTemplate}
                        onEdit={() => onEdit(t)}
                        onDelete={() => onDelete(t)}
                        onStatusChange={(s) => onStatusChange(t, s)}
                        onDueDateChange={(d) => onDueDateChange(t, d)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

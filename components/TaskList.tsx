"use client";

import React, { useMemo, useState } from "react";
import type { Task, TaskStatus } from "@/lib/types";
import { MobileTaskCard } from "@/components/MobileTaskCard";
import { TaskRow } from "@/components/TaskRow";
import { useTodayTaskIds } from "@/lib/useTodayTaskIds";

export function TaskList({
  active,
  completed,
  groupedActive,
  groupByDueThisWeek,
  aeColors,
  onEdit,
  onStatusChange,
  onToggleToday,
}: {
  active: Task[];
  completed: Task[];
  groupedActive?: {
    dueThisWeek: Task[];
  } | null;
  groupByDueThisWeek?: boolean;
  aeColors?: Record<string, string>;
  onEdit: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onToggleToday: (taskId: string) => void;
}) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({});

  const { has } = useTodayTaskIds();

  const desktopGridTemplate = "minmax(26ch, 1fr) 7ch 24ch 16ch 14ch 7ch";

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

  const renderDesktopTask = (t: Task) => {
    const hasDescription = Boolean(t.description && t.description.trim().length);
    const expanded = Boolean(expandedById[t.id]);

    return (
      <div key={t.id}>
        <TaskRow
          task={t}
          gridTemplateColumns={desktopGridTemplate}
          aeColor={aeColors?.[t.ae]}
          expanded={expanded}
          expandDisabled={!hasDescription}
          inToday={has(t.id)}
          onToggleExpand={() => {
            if (!hasDescription) return;
            setExpandedById((prev) => ({ ...prev, [t.id]: !prev[t.id] }));
          }}
          onEdit={() => onEdit(t)}
          onStatusChange={(s) => onStatusChange(t, s)}
          onToggleToday={() => onToggleToday(t.id)}
        />

        {expanded && hasDescription ? (
          <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3">
            <div
              className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700"
              style={{ paddingLeft: "2.25rem" }}
            >
              {t.description}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const shouldGroupDesktopActive = Boolean(groupByDueThisWeek && groupedActive);

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

      <div className="md:hidden">
        <div className="space-y-3">
          {active.map((t) => (
            <MobileTaskCard
              key={t.id}
              task={t}
              aeColor={aeColors?.[t.ae]}
              onToggleToday={() => onToggleToday(t.id)}
              inToday={has(t.id)}
            />
          ))}
        </div>
      </div>

      <div className="hidden md:block">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div
            className="grid items-center gap-3 px-4 py-3 text-sm text-zinc-600"
            style={{ gridTemplateColumns: desktopGridTemplate }}
          >
            <div className="min-w-0 text-xs font-medium">Task</div>
            <div className="min-w-0 pr-4 text-xs font-medium">AE</div>
            <div className="min-w-0 pl-4 text-xs font-medium">Account</div>
            <div className="min-w-0 text-xs font-medium">Due</div>
            <div className="min-w-0 text-xs font-medium">Status</div>
            <div className="min-w-0" />
          </div>
          {active.length === 0 ? (
            <div className="border-t border-zinc-100 px-4 py-6 text-sm text-zinc-600">
              No active tasks.
            </div>
          ) : (
            shouldGroupDesktopActive ? (
              <div>
                <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-2 text-xs font-semibold text-zinc-700">
                  Due this week
                </div>
                {groupedActive!.dueThisWeek.length === 0 ? (
                  <div className="border-t border-zinc-100 px-4 py-4 text-sm text-zinc-600">
                    No tasks due this week.
                  </div>
                ) : (
                  groupedActive!.dueThisWeek.map(renderDesktopTask)
                )}
              </div>
            ) : (
              active.map(renderDesktopTask)
            )
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
                  <div key={t.id} className="md:hidden">
                    <MobileTaskCard
                      task={t}
                      aeColor={aeColors?.[t.ae]}
                      onToggleToday={() => onToggleToday(t.id)}
                      inToday={has(t.id)}
                    />
                  </div>
                ))}
                <div className="hidden md:block">
                  <div className="overflow-hidden rounded-2xl border border-zinc-200">
                    {completed.map((t) => {
                      const hasDescription = Boolean(t.description && t.description.trim().length);
                      const expanded = Boolean(expandedById[t.id]);

                      return (
                        <div key={t.id}>
                          <TaskRow
                            task={t}
                            gridTemplateColumns={desktopGridTemplate}
                            expanded={expanded}
                            expandDisabled={!hasDescription}
                            inToday={has(t.id)}
                            onToggleExpand={() => {
                              if (!hasDescription) return;
                              setExpandedById((prev) => ({ ...prev, [t.id]: !prev[t.id] }));
                            }}
                            onEdit={() => onEdit(t)}
                            onStatusChange={(s) => onStatusChange(t, s)}
                            onToggleToday={() => onToggleToday(t.id)}
                          />

                          {expanded && hasDescription ? (
                            <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3">
                              <div
                                className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700"
                                style={{ paddingLeft: "2.25rem" }}
                              >
                                {t.description}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
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

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useAppData } from "@/components/AppDataProvider";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AESummaryBar } from "@/components/AESummaryBar";
import { ModalOrSheet } from "@/components/ModalOrSheet";
import { TaskForm, type TaskDraft } from "@/components/TaskForm";
import { TaskList } from "@/components/TaskList";
import { useToast } from "@/components/Toast";
import {
  createTask,
  deleteTask,
  updateTask,
} from "@/lib/dataProvider";
import type { Task, TaskFilters, TaskStatus } from "@/lib/types";
import {
  filterTasks,
  sortTasks,
  sortTasksWithInProgressPriority,
} from "@/lib/taskLogic";
import { getChicagoWeekRange, isOverdue } from "@/lib/dateRanges";
import { useTodayTaskIds } from "@/lib/useTodayTaskIds";

function mergeUnknowns(managed: string[], referenced: string[]): string[] {
  const set = new Set(managed);
  for (const v of referenced) {
    if (!v) continue;
    if (!set.has(v)) set.add(v);
  }
  return Array.from(set);
}

export default function Home() {
  const { push } = useToast();
  const { tasks, aes, aeColors, accounts } = useAppData();
  const { toggle: toggleToday, has: hasToday } = useTodayTaskIds();

  const [filters, setFilters] = useState<TaskFilters>({
    query: "",
    ae: "ALL",
    account: "ALL",
    status: "ALL",
    dueThisWeek: false,
    overdue: false,
  });

  const [composerOpen, setComposerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task | null>(null);

  const mergedAEs = useMemo(() => mergeUnknowns(aes, tasks.map((t) => t.ae)), [aes, tasks]);
  const mergedAccounts = useMemo(
    () => mergeUnknowns(accounts, tasks.map((t) => t.account)),
    [accounts, tasks],
  );

  const toggleTodayWithToast = (taskId: string) => {
    const wasInToday = hasToday(taskId);
    toggleToday(taskId);
    push({
      kind: "success",
      title: wasInToday ? "Removed from Today" : "Added to Today",
    });
  };

  const clearAll = () => {
    setFilters({
      query: "",
      ae: "ALL",
      account: "ALL",
      status: "ALL",
      dueThisWeek: false,
      overdue: false,
    });
  };

  const filteredTasks = useMemo(() => {
    const base = filterTasks(tasks, filters);

    const shouldExcludeDoneByDefault = (filters.dueThisWeek || filters.overdue) && filters.status === "ALL";
    const nonDone = shouldExcludeDoneByDefault ? base.filter((t) => t.status !== "DONE") : base;

    if (filters.dueThisWeek) {
      const { start, end } = getChicagoWeekRange();
      return nonDone.filter((t) => {
        if (!t.dueDate) return false;
        if (isOverdue(t)) return false;
        return t.dueDate >= start && t.dueDate < end;
      });
    }

    if (filters.overdue) {
      return nonDone.filter((t) => isOverdue(t));
    }

    return nonDone;
  }, [tasks, filters]);

  const { active, completed } = useMemo(() => {
    if (filters.dueThisWeek || filters.overdue) return sortTasks(filteredTasks);
    return sortTasksWithInProgressPriority(filteredTasks);
  }, [filteredTasks, filters.dueThisWeek, filters.overdue]);

  const groupedActive = useMemo(() => {
    if (!filters.dueThisWeek) return null;

    return {
      dueThisWeek: active,
    };
  }, [active, filters.dueThisWeek]);

  const openNew = () => {
    setEditingTask(null);
    setComposerOpen(true);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "n") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (composerOpen || confirmOpen) return;

      const target = e.target as Element | null;
      if (target) {
        const tag = target.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;
        if (target instanceof HTMLElement && target.isContentEditable) return;
      }

      if (typeof window !== "undefined") {
        // Desktop-only shortcut (Tailwind md+ intent).
        if (!window.matchMedia("(min-width: 768px)").matches) return;
      }

      e.preventDefault();
      openNew();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [composerOpen, confirmOpen]);

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setComposerOpen(true);
  };

  const closeComposer = () => {
    setComposerOpen(false);
    setEditingTask(null);
  };

  const askDelete = (task: Task) => {
    setTaskPendingDelete(task);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!taskPendingDelete) return;
    await deleteTask(taskPendingDelete.id);
    push({ kind: "success", title: "Task deleted" });
    setConfirmOpen(false);
    setTaskPendingDelete(null);
    closeComposer();
  };

  const upsertFromDraft = async (draft: TaskDraft) => {
    try {
      const dueDate = draft.dueDate.trim().length ? draft.dueDate.trim() : undefined;
      const description = draft.description.trim().length ? draft.description.trim() : undefined;
      const account = draft.account.trim().length ? draft.account.trim() : undefined;

      if (editingTask) {
        await updateTask(editingTask.id, {
          title: draft.title,
          description,
          ae: draft.ae,
          account: draft.account,
          dueDate,
          status: draft.status,
        });
        push({ kind: "success", title: "Task updated" });
        closeComposer();
        return;
      }

      await createTask({
        title: draft.title,
        description,
        ae: draft.ae,
        account,
        status: draft.status,
        dueDate,
      });
      push({ kind: "success", title: "Task created" });
      closeComposer();
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e ? String(e.message) : "Unknown error";
      push({ kind: "error", title: "Failed to save task", message: msg });
      console.error("upsertFromDraft failed", e);
    }
  };

  const updateStatus = (task: Task, status: TaskStatus) => {
    void updateTask(task.id, { status });
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <AppHeader
          right={
            <button
              type="button"
              onClick={openNew}
              className="h-11 shrink-0 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
            >
              <span>New Task</span>
              <span className="ml-2 hidden items-center rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white md:inline-flex">
                N
              </span>
            </button>
          }
        />

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setFilters((prev) => {
                const nextDueThisWeek = !prev.dueThisWeek;
                return {
                  ...prev,
                  dueThisWeek: nextDueThisWeek,
                  overdue: nextDueThisWeek ? false : prev.overdue,
                };
              })
            }
            className={
              "h-10 rounded-xl border px-3 text-sm font-medium transition " +
              (filters.dueThisWeek
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50")
            }
          >
            Due this week
          </button>

          <button
            type="button"
            onClick={() =>
              setFilters((prev) => {
                const nextOverdue = !prev.overdue;
                return {
                  ...prev,
                  overdue: nextOverdue,
                  dueThisWeek: nextOverdue ? false : prev.dueThisWeek,
                };
              })
            }
            className={
              "h-10 rounded-xl border px-3 text-sm font-medium transition " +
              (filters.overdue
                ? "border-red-700 bg-red-600 text-white"
                : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50")
            }
          >
            Overdue
          </button>

          <button
            type="button"
            onClick={clearAll}
            className="ml-auto h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Clear
          </button>
        </div>

        <div className="mt-3">
          <AESummaryBar
            tasks={tasks}
            aes={mergedAEs}
            aeColors={aeColors}
            activeAE={filters.ae}
            onSelectAE={(ae) => setFilters({ ...filters, ae })}
          />
        </div>

        <div className="mt-4">
          <TaskList
            active={active}
            completed={completed}
            groupedActive={groupedActive}
            groupByDueThisWeek={filters.dueThisWeek}
            aeColors={aeColors}
            onEdit={openEdit}
            onStatusChange={updateStatus}
            onToggleToday={toggleTodayWithToast}
          />
        </div>
      </div>

      <ModalOrSheet
        open={composerOpen}
        title={editingTask ? "Edit task" : "New task"}
        description={editingTask ? "Update details and save." : "Create a new task."}
        onClose={closeComposer}
      >
        <TaskForm
          initial={editingTask ?? undefined}
          aes={mergedAEs}
          accounts={mergedAccounts}
          submitLabel={editingTask ? "Save" : "Create"}
          onCancel={closeComposer}
          onSubmit={upsertFromDraft}
        />

        {editingTask ? (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => askDelete(editingTask)}
              className="h-11 rounded-xl border border-red-200 bg-white px-4 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Delete task
            </button>
          </div>
        ) : null}
      </ModalOrSheet>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete task?"
        message={taskPendingDelete ? `This will delete “${taskPendingDelete.title}”.` : ""}
        confirmLabel="Delete"
        destructive
        onClose={() => {
          setConfirmOpen(false);
          setTaskPendingDelete(null);
        }}
        onConfirm={doDelete}
      />
    </div>
  );
}

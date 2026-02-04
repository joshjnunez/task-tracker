"use client";

import React, { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useAppData } from "@/components/AppDataProvider";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Filters } from "@/components/Filters";
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
} from "@/lib/taskLogic";

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
  const { tasks, aes, accounts } = useAppData();

  const [filters, setFilters] = useState<TaskFilters>({
    query: "",
    ae: "ALL",
    account: "ALL",
    status: "ALL",
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

  const filteredTasks = useMemo(() => filterTasks(tasks, filters), [tasks, filters]);
  const { active, completed } = useMemo(() => sortTasks(filteredTasks), [filteredTasks]);

  const openNew = () => {
    setEditingTask(null);
    setComposerOpen(true);
  };

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

  const updateDueDate = (task: Task, dueDate: string) => {
    const next = dueDate.trim().length ? dueDate : undefined;
    void updateTask(task.id, { dueDate: next });
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
              New Task
            </button>
          }
        />

        <div className="mt-5">
          <Filters
            filters={filters}
            aes={mergedAEs}
            accounts={mergedAccounts}
            onChange={setFilters}
            onClear={() =>
              setFilters({ query: "", ae: "ALL", account: "ALL", status: "ALL" })
            }
          />
        </div>

        <div className="mt-4">
          <TaskList
            active={active}
            completed={completed}
            onEdit={openEdit}
            onDelete={askDelete}
            onStatusChange={updateStatus}
            onDueDateChange={updateDueDate}
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

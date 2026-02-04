"use client";

import React, { useMemo, useState } from "react";
import type { Task, TaskStatus } from "@/lib/types";
import { getAllStatuses, getStatusLabel } from "@/lib/taskLogic";

export type TaskDraft = {
  title: string;
  description: string;
  ae: string;
  account: string;
  status: TaskStatus;
  dueDate: string;
};

export function TaskForm({
  initial,
  aes,
  accounts,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Task;
  aes: string[];
  accounts: string[];
  submitLabel: string;
  onSubmit: (draft: TaskDraft) => void;
  onCancel: () => void;
}) {
  const isEditing = Boolean(initial);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [ae, setAe] = useState(initial?.ae ?? "");
  const [account, setAccount] = useState(initial?.account ?? "");
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? "BACKLOG");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [touched, setTouched] = useState(false);

  const canSubmit = useMemo(() => {
    if (isEditing) {
      return title.trim().length > 0 && ae.trim().length > 0 && account.trim().length > 0;
    }
    return title.trim().length > 0 && ae.trim().length > 0;
  }, [title, ae, account, isEditing]);

  const statuses = getAllStatuses();

  const onInternalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      ae: ae.trim(),
      account: account.trim(),
      status,
      dueDate: dueDate.trim(),
    });
  };

  return (
    <form onSubmit={onInternalSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <div className="text-xs font-medium text-zinc-600">Title *</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched(true)}
            className={`mt-1 h-11 w-full rounded-xl border bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 ${
              touched && title.trim().length === 0
                ? "border-red-300"
                : "border-zinc-200"
            }`}
            placeholder="e.g. Follow up with customer"
            autoFocus
          />
        </label>

        <label className="sm:col-span-2">
          <div className="text-xs font-medium text-zinc-600">Description</div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 min-h-24 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            placeholder="Optional details…"
          />
        </label>

        <label>
          <div className="text-xs font-medium text-zinc-600">AE *</div>
          <select
            value={ae}
            onChange={(e) => setAe(e.target.value)}
            onBlur={() => setTouched(true)}
            className={`mt-1 h-11 w-full rounded-xl border bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 ${
              touched && ae.trim().length === 0
                ? "border-red-300"
                : "border-zinc-200"
            }`}
          >
            <option value="">Select AE…</option>
            {aes.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label>
          <div className="text-xs font-medium text-zinc-600">
            Account{isEditing ? " *" : ""}
          </div>
          <select
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            onBlur={() => setTouched(true)}
            className={`mt-1 h-11 w-full rounded-xl border bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 ${
              touched && isEditing && account.trim().length === 0
                ? "border-red-300"
                : "border-zinc-200"
            }`}
          >
            <option value="">Select account…</option>
            {accounts.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label>
          <div className="text-xs font-medium text-zinc-600">Status</div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
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
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
          />
        </label>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="h-11 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

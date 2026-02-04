"use client";

import React, { useMemo, useState } from "react";
import type { TaskFilters, TaskStatus } from "@/lib/types";
import { getAllStatuses, getStatusLabel } from "@/lib/taskLogic";
import { ModalOrSheet } from "@/components/ModalOrSheet";

function activeFilterCount(filters: TaskFilters): number {
  let count = 0;
  if (filters.query.trim().length > 0) count += 1;
  if (filters.ae !== "ALL") count += 1;
  if (filters.account !== "ALL") count += 1;
  if (filters.status !== "ALL") count += 1;
  if (filters.dueThisWeek) count += 1;
  if (filters.overdue) count += 1;
  return count;
}

export function MobileFilters({
  filters,
  aes,
  accounts,
  onChange,
  onClear,
}: {
  filters: TaskFilters;
  aes: string[];
  accounts: string[];
  onChange: (next: TaskFilters) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const statuses = getAllStatuses();

  const count = useMemo(() => activeFilterCount(filters), [filters]);

  return (
    <>
      <div className="sticky top-0 z-30 -mx-4 bg-[var(--background)] px-4 pb-3 pt-2">
        <div className="flex items-center gap-2">
          <input
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder="Search…"
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-inner outline-none focus:border-zinc-400"
          />

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative h-11 shrink-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Filters
            {count > 0 ? (
              <span className="ml-1 text-xs font-semibold text-zinc-600">({count})</span>
            ) : null}
          </button>
        </div>
      </div>

      <ModalOrSheet
        open={open}
        title="Filters"
        description="Refine tasks"
        onClose={() => setOpen(false)}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            <label className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2">
              <div className="text-sm font-medium text-zinc-800">Due this week</div>
              <input
                type="checkbox"
                checked={filters.dueThisWeek}
                onChange={(e) => {
                  const nextDueThisWeek = e.target.checked;
                  onChange({
                    ...filters,
                    dueThisWeek: nextDueThisWeek,
                    overdue: nextDueThisWeek ? false : filters.overdue,
                  });
                }}
                className="h-4 w-4 accent-zinc-900"
              />
            </label>

            <label className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2">
              <div className="text-sm font-medium text-zinc-800">Overdue</div>
              <input
                type="checkbox"
                checked={filters.overdue}
                onChange={(e) => {
                  const nextOverdue = e.target.checked;
                  onChange({
                    ...filters,
                    overdue: nextOverdue,
                    dueThisWeek: nextOverdue ? false : filters.dueThisWeek,
                  });
                }}
                className="h-4 w-4 accent-zinc-900"
              />
            </label>
          </div>

          <label>
            <div className="text-xs font-medium text-zinc-600">AE</div>
            <select
              value={filters.ae}
              onChange={(e) => onChange({ ...filters, ae: e.target.value })}
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            >
              <option value="ALL">All</option>
              {aes.map((ae) => (
                <option key={ae} value={ae}>
                  {ae}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div className="text-xs font-medium text-zinc-600">Account</div>
            <select
              value={filters.account}
              onChange={(e) => onChange({ ...filters, account: e.target.value })}
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            >
              <option value="ALL">All</option>
              {accounts.map((acc) => (
                <option key={acc} value={acc}>
                  {acc}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div className="text-xs font-medium text-zinc-600">Status</div>
            <select
              value={filters.status}
              onChange={(e) => onChange({ ...filters, status: e.target.value as "ALL" | TaskStatus })}
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
            >
              <option value="ALL">All</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {getStatusLabel(s)}
                </option>
              ))}
            </select>
          </label>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Clear
            </button>
          </div>
        </div>
      </ModalOrSheet>
    </>
  );
}

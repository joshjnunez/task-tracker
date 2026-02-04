"use client";

import React from "react";
import type { TaskFilters, TaskStatus } from "@/lib/types";
import { getAllStatuses, getStatusLabel } from "@/lib/taskLogic";

export function Filters({
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
  const statuses = getAllStatuses();

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
        <label className="sm:col-span-4">
          <div className="text-xs font-medium text-zinc-600">Search</div>
          <input
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder="Search title…"
            className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-inner outline-none focus:border-zinc-400"
          />
        </label>

        <label className="sm:col-span-2">
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

        <label className="sm:col-span-3">
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

        <label className="sm:col-span-2">
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

        <div className="sm:col-span-1">
          <button
            type="button"
            onClick={onClear}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

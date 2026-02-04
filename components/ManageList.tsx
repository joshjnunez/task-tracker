"use client";

import React, { useMemo, useState } from "react";

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

export function ManageList({
  title,
  items,
  inUseCount,
  onAdd,
  onRemove,
}: {
  title: string;
  items: string[];
  inUseCount: (value: string) => number;
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const keys = useMemo(() => new Set(items.map(normalizeKey)), [items]);

  const submit = () => {
    const trimmed = value.trim();
    const key = normalizeKey(trimmed);

    if (!trimmed.length) {
      setError("Cannot be empty");
      return;
    }
    if (keys.has(key)) {
      setError("Already exists");
      return;
    }

    onAdd(trimmed);
    setValue("");
    setError(null);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-base font-semibold text-zinc-900">{title}</div>

      <div className="mt-3 flex gap-2">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
          placeholder={`Add ${title.toLowerCase().slice(0, -1)}…`}
        />
        <button
          type="button"
          onClick={submit}
          className="h-11 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Add
        </button>
      </div>
      {error ? <div className="mt-2 text-sm text-red-700">{error}</div> : null}

      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <div className="text-sm text-zinc-600">No items.</div>
        ) : (
          items.map((it) => {
            const used = inUseCount(it);
            return (
              <div
                key={it}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-zinc-900">{it}</div>
                  {used > 0 ? (
                    <div className="mt-0.5 text-xs text-zinc-500">In use by {used} tasks</div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(it)}
                  className="h-9 shrink-0 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                >
                  Remove
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

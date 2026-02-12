"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "task-tracker.today.v1";
const CHANGE_EVENT = "today-tasks-changed";

type TodayStorageShape = {
  date: string;
  taskIds: string[];
};

export function getTodayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function safeParse(raw: string | null): TodayStorageShape | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object") return null;
    const date = (v as { date?: unknown }).date;
    const taskIds = (v as { taskIds?: unknown }).taskIds;
    if (typeof date !== "string") return null;
    if (!Array.isArray(taskIds) || !taskIds.every((x) => typeof x === "string")) return null;
    return { date, taskIds };
  } catch {
    return null;
  }
}

function readStorage(): TodayStorageShape {
  const today = getTodayKey();
  if (typeof window === "undefined") return { date: today, taskIds: [] };

  const parsed = safeParse(window.sessionStorage.getItem(STORAGE_KEY));
  if (!parsed || parsed.date !== today) {
    const next = { date: today, taskIds: [] };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  return parsed;
}

function writeStorage(taskIds: string[]) {
  const today = getTodayKey();
  if (typeof window === "undefined") return;
  const next: TodayStorageShape = { date: today, taskIds };
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function emitChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useTodayTaskIds() {
  const [taskIds, setTaskIds] = useState<string[]>(() => readStorage().taskIds);

  const refresh = useCallback(() => {
    setTaskIds(readStorage().taskIds);
  }, []);

  useEffect(() => {
    const onChange = () => refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      refresh();
    };

    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const set = useMemo(() => new Set(taskIds), [taskIds]);

  const add = useCallback(
    (id: string) => {
      if (!id) return;
      const next = Array.from(new Set([...readStorage().taskIds, id]));
      writeStorage(next);
      setTaskIds(next);
      emitChange();
    },
    [setTaskIds],
  );

  const remove = useCallback(
    (id: string) => {
      const next = readStorage().taskIds.filter((x) => x !== id);
      writeStorage(next);
      setTaskIds(next);
      emitChange();
    },
    [setTaskIds],
  );

  const toggle = useCallback(
    (id: string) => {
      if (set.has(id)) remove(id);
      else add(id);
    },
    [add, remove, set],
  );

  const has = useCallback((id: string) => set.has(id), [set]);

  return { taskIds, add, remove, toggle, has };
}

"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Task } from "@/lib/types";
import { getSnapshot, subscribe } from "@/lib/dataProvider";

type AppDataContextValue = {
  hydrated: boolean;
  tasks: Task[];
  aes: string[];
  accounts: string[];
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [aes, setAEs] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<string[]>([]);

  useEffect(() => {
    const snap = getSnapshot();
    queueMicrotask(() => {
      setTasks(snap.tasks);
      setAEs(snap.aes);
      setAccounts(snap.accounts);
      setHydrated(snap.hydrated);
    });

    return subscribe(() => {
      const next = getSnapshot();
      setTasks(next.tasks);
      setAEs(next.aes);
      setAccounts(next.accounts);
      setHydrated(next.hydrated);
    });
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({ hydrated, tasks, aes, accounts }),
    [hydrated, tasks, aes, accounts],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

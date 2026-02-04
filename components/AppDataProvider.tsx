"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Task } from "@/lib/types";
import { getSnapshot, initDataProvider, subscribe } from "@/lib/dataProvider";

type AppDataContextValue = {
  hydrated: boolean;
  tasks: Task[];
  aes: string[];
  aeColors: Record<string, string>;
  accounts: string[];
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [aes, setAEs] = useState<string[]>([]);
  const [aeColors, setAEColors] = useState<Record<string, string>>({});
  const [accounts, setAccounts] = useState<string[]>([]);

  useEffect(() => {
    let unsub: (() => void) | null = null;

    void initDataProvider().finally(() => {
      const snap = getSnapshot();
      setTasks(snap.tasks);
      setAEs(snap.aes);
      setAEColors(snap.aeColors);
      setAccounts(snap.accounts);
      setHydrated(snap.hydrated);

      unsub = subscribe(() => {
        const next = getSnapshot();
        setTasks(next.tasks);
        setAEs(next.aes);
        setAEColors(next.aeColors);
        setAccounts(next.accounts);
        setHydrated(next.hydrated);
      });
    });

    return () => {
      unsub?.();
    };
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({ hydrated, tasks, aes, aeColors, accounts }),
    [hydrated, tasks, aes, aeColors, accounts],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

"use client";

import React, { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ManageList } from "@/components/ManageList";
import { useAppData } from "@/components/AppDataProvider";
import { useToast } from "@/components/Toast";
import {
  createAccount,
  createAE,
  deleteAccount,
  deleteAE,
} from "@/lib/dataProvider";

export default function ManagePage() {
  const { tasks, aes, aeColors, accounts } = useAppData();
  const { push } = useToast();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<null | {
    kind: "AE" | "ACCOUNT";
    value: string;
    used: number;
  }>(null);

  const aeInUseCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tasks) {
      if (t.status === "DONE") continue;
      counts.set(t.ae, (counts.get(t.ae) ?? 0) + 1);
    }
    return (value: string) => counts.get(value) ?? 0;
  }, [tasks]);

  const accountInUseCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tasks) {
      counts.set(t.account, (counts.get(t.account) ?? 0) + 1);
    }
    return (value: string) => counts.get(value) ?? 0;
  }, [tasks]);

  const addAE = async (value: string) => {
    try {
      await createAE(value);
      push({ kind: "success", title: "AE added" });
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e ? String(e.message) : "Unknown error";
      push({ kind: "error", title: "Failed to add AE", message: msg });
      console.error("createAE failed", e);
    }
  };

  const addAccount = async (value: string) => {
    await createAccount(value);
    push({ kind: "success", title: "Account added" });
  };

  const removeAE = async (value: string) => {
    const used = aeInUseCount(value);
    if (used > 0) {
      setPendingRemove({ kind: "AE", value, used });
      setConfirmOpen(true);
      return;
    }
    try {
      await deleteAE(value);
      push({ kind: "success", title: "AE removed" });
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e ? String(e.message) : "Unknown error";
      push({ kind: "error", title: "Failed to remove AE", message: msg });
      console.error("deleteAE failed", e);
    }
  };

  const removeAccount = async (value: string) => {
    const used = accountInUseCount(value);
    if (used > 0) {
      setPendingRemove({ kind: "ACCOUNT", value, used });
      setConfirmOpen(true);
      return;
    }
    await deleteAccount(value);
    push({ kind: "success", title: "Account removed" });
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <AppHeader subtitle="Manage AEs and Accounts" />

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ManageList
            title="AEs"
            items={aes}
            colors={aeColors}
            inUseCount={aeInUseCount}
            onAdd={addAE}
            onRemove={removeAE}
          />

          <ManageList
            title="Accounts"
            items={accounts}
            inUseCount={accountInUseCount}
            onAdd={addAccount}
            onRemove={removeAccount}
          />
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Cannot remove"
        message={
          pendingRemove
            ? `${pendingRemove.kind} “${pendingRemove.value}” is in use by ${pendingRemove.used} tasks.`
            : ""
        }
        confirmLabel="OK"
        onClose={() => {
          setConfirmOpen(false);
          setPendingRemove(null);
        }}
        onConfirm={() => {
          setConfirmOpen(false);
          setPendingRemove(null);
        }}
      />
    </div>
  );
}

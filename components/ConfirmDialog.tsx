"use client";

import React, { useEffect } from "react";
import { ModalOrSheet } from "@/components/ModalOrSheet";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  destructive = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById("confirm-primary");
      if (el instanceof HTMLButtonElement) el.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  return (
    <ModalOrSheet open={open} title={title} description={message} onClose={onClose}>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Cancel
        </button>
        <button
          id="confirm-primary"
          type="button"
          onClick={onConfirm}
          className={`h-11 rounded-xl px-4 text-sm font-medium text-white ${
            destructive
              ? "bg-red-600 hover:bg-red-700"
              : "bg-zinc-900 hover:bg-zinc-800"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </ModalOrSheet>
  );
}

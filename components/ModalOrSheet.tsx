"use client";

import React, { useEffect } from "react";

export function ModalOrSheet({
  open,
  title,
  description,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Close"
        onClick={onClose}
      />

      <div
        className="fixed inset-0 z-40 flex flex-col bg-white md:hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base font-semibold text-zinc-900">{title}</div>
              {description ? <div className="mt-1 text-sm text-zinc-600">{description}</div> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 pb-6">{children}</div>
      </div>

      <div
        className="fixed left-1/2 top-1/2 z-40 hidden w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white shadow-lg md:block"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base font-semibold text-zinc-900">{title}</div>
              {description ? <div className="mt-1 text-sm text-zinc-600">{description}</div> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}

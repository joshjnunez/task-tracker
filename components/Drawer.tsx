"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";

export function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const isManage = pathname === "/manage";

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Close navigation"
        onClick={onClose}
      />
      <div
        className="absolute left-0 top-0 h-full w-[min(85vw,320px)] border-r border-zinc-200 bg-white shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 p-4">
          <div>
            <div className="text-base font-semibold text-zinc-900">Task Tracker</div>
            <div className="mt-0.5 text-sm text-zinc-600">Navigation</div>
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

        <nav className="p-2">
          <Link
            href="/manage"
            onClick={onClose}
            className={`flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              isManage ? "bg-zinc-900 text-white" : "text-zinc-800 hover:bg-zinc-100"
            }`}
          >
            Manage
            <span
              className={
                "ml-auto hidden items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold md:inline-flex " +
                (isManage ? "border-white/20 bg-white/10 text-white" : "border-zinc-200 bg-white text-zinc-700")
              }
            >
              M
            </span>
          </Link>
        </nav>
      </div>
    </div>
  );
}

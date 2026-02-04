"use client";

import Link from "next/link";
import React, { useState } from "react";
import { Drawer } from "@/components/Drawer";

export function AppHeader({
  right,
  subtitle = "AE / Account action items",
}: {
  right?: React.ReactNode;
  subtitle?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-0.5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
            aria-label="Open navigation"
          >
            <span aria-hidden className="text-lg leading-none">
              ☰
            </span>
          </button>

          <div>
            <Link
              href="/"
              className="text-2xl font-semibold tracking-tight text-zinc-900"
            >
              Task Tracker
            </Link>
            <div className="mt-1 text-sm text-zinc-600">{subtitle}</div>
          </div>
        </div>

        <div className="shrink-0">{right}</div>
      </header>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

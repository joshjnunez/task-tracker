"use client";

import React, { useEffect, useMemo, useState } from "react";

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMobile;
}

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
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const containerClass = useMemo(() => {
    if (isMobile) {
      return "fixed inset-0 z-40 flex flex-col bg-white";
    }

    return "fixed left-1/2 top-1/2 z-40 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white shadow-lg";
  }, [isMobile]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Close"
        onClick={onClose}
      />
      <div className={containerClass} role="dialog" aria-modal="true">
        <div className={isMobile ? "p-4" : "p-5"}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base font-semibold text-zinc-900">
                {title}
              </div>
              {description ? (
                <div className="mt-1 text-sm text-zinc-600">
                  {description}
                </div>
              ) : null}
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

        <div className={isMobile ? "flex-1 overflow-auto px-4 pb-6" : "px-5 pb-6"}>
          {children}
        </div>
      </div>
    </div>
  );
}

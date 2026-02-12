"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { AppDataProvider } from "@/components/AppDataProvider";
import { ToastProvider } from "@/components/Toast";

function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "m" && e.key !== "t" && e.key !== "h") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      const target = e.target as Element | null;
      if (target) {
        const tag = target.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;
        if (target instanceof HTMLElement && target.isContentEditable) return;
      }

      // Desktop-only shortcut (Tailwind md+ intent).
      if (!window.matchMedia("(min-width: 768px)").matches) return;
      if (e.key === "m" && pathname === "/manage") return;
      if (e.key === "t" && pathname === "/today") return;
      if (e.key === "h" && pathname === "/") return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;

      e.preventDefault();
      router.push(e.key === "t" ? "/today" : e.key === "m" ? "/manage" : "/");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, pathname]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AppDataProvider>
        <KeyboardShortcuts />
        {children}
      </AppDataProvider>
    </ToastProvider>
  );
}

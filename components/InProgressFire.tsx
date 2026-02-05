"use client";

import { useEffect, useRef } from "react";

import type { TaskStatus } from "@/lib/types";

export function InProgressFire({ status }: { status: TaskStatus }) {
  const prev = useRef<TaskStatus | null>(null);
  const elRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const prevStatus = prev.current;
    prev.current = status;

    if (prevStatus === null) return;

    if (prevStatus !== "IN_PROGRESS" && status === "IN_PROGRESS") {
      const el = elRef.current;
      if (!el) return;

      el.classList.remove("tt-fire-fade-in");
      void el.offsetWidth;
      el.classList.add("tt-fire-fade-in");
    }
  }, [status]);

  if (status !== "IN_PROGRESS") return null;

  return (
    <span ref={elRef} className="mr-2 inline-block">
      🔥
    </span>
  );
}

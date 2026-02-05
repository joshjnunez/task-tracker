import { NextResponse } from "next/server";

import { AE_MUTED_PALETTE } from "@/lib/aeColors";
import { supabase } from "@/lib/supabase";

type AERow = {
  id: string;
  name: string;
  color: string | null;
  created_at: string | null;
};

function isMissingColumn(error: { message?: string; code?: string } | null | undefined): boolean {
  const msg = (error?.message ?? "").toLowerCase();
  return msg.includes("column") && msg.includes("color");
}

export async function POST() {
  const res = await supabase
    .from("aes")
    .select("id,name,color,created_at")
    .order("created_at", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true })
    .returns<AERow[]>();

  if (res.error) {
    if (isMissingColumn(res.error)) {
      return NextResponse.json(
        { error: "AE color reconciliation requires aes.color column" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to load AEs", detail: res.error.message },
      { status: 500 },
    );
  }

  const rows = res.data ?? [];

  const used = new Set<string>();
  const reassign: AERow[] = [];
  const changes: { id: string; from: string | null; to: string }[] = [];

  for (const ae of rows) {
    const c = (ae.color ?? "").trim();
    if (!c || used.has(c)) {
      reassign.push(ae);
      continue;
    }
    used.add(c);
  }

  const available = AE_MUTED_PALETTE.filter((c) => !used.has(c));

  for (const ae of reassign) {
    const next = available.shift();
    if (!next) {
      console.warn("AE color palette exhausted during reconcile", {
        total: rows.length,
        palette: AE_MUTED_PALETTE.length,
      });
      break;
    }

    if ((ae.color ?? "").trim() === next) continue;
    changes.push({ id: ae.id, from: ae.color, to: next });
    used.add(next);
  }

  if (changes.length === 0) {
    return NextResponse.json({ ok: true, changed: 0 });
  }

  for (const c of changes) {
    const updated = await supabase.from("aes").update({ color: c.to }).eq("id", c.id);
    if (updated.error) {
      return NextResponse.json(
        { error: "Failed to update AE colors", detail: updated.error.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true, changed: changes.length, changes });
}

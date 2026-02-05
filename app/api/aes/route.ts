import { NextResponse } from "next/server";
import { z } from "zod";

import { supabase } from "@/lib/supabase";
import { AE_MUTED_PALETTE } from "@/lib/aeColors";

const createSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  color: z.string().trim().optional(),
});

const deleteQuerySchema = z.object({
  id: z.string().uuid("id must be a UUID"),
});

type AE = { id: string; name: string; color?: string | null };

function isMissingColumn(error: { message?: string; code?: string } | null | undefined): boolean {
  const msg = (error?.message ?? "").toLowerCase();
  return msg.includes("column") && msg.includes("color");
}

function isUniqueViolation(error: { code?: string } | null | undefined): boolean {
  return error?.code === "23505";
}

export async function GET() {
  const withColor = await supabase
    .from("aes")
    .select("id,name,color")
    .order("name", { ascending: true })
    .returns<AE[]>();

  if (!withColor.error) {
    const rows = withColor.data ?? [];
    const colors = rows
      .map((r) => (r.color ?? "").trim())
      .filter((c) => c.length > 0);
    if (rows.length <= AE_MUTED_PALETTE.length) {
      const unique = new Set(colors);
      if (unique.size !== colors.length) {
        console.warn("/api/aes GET duplicate colors detected", {
          total: rows.length,
          colored: colors.length,
          unique: unique.size,
        });
      }
    }
    return NextResponse.json(rows);
  }

  if (isMissingColumn(withColor.error)) {
    const fallback = await supabase
      .from("aes")
      .select("id,name")
      .order("name", { ascending: true })
      .returns<{ id: string; name: string }[]>();

    if (fallback.error) {
      console.error("/api/aes GET fallback failed", {
        message: fallback.error.message,
        code: (fallback.error as unknown as { code?: string }).code,
      });
      return NextResponse.json(
        { error: "Failed to fetch AEs", detail: fallback.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json((fallback.data ?? []).map((r) => ({ ...r, color: null })));
  }

  console.error("/api/aes GET failed", {
    message: withColor.error.message,
    code: (withColor.error as unknown as { code?: string }).code,
  });
  return NextResponse.json(
    { error: "Failed to fetch AEs", detail: withColor.error.message },
    { status: 500 },
  );
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const name = parsed.data.name.trim();
  const requestedColor = parsed.data.color?.trim();

  const { data: existing, error: existingError } = await supabase
    .from("aes")
    .select("id")
    .ilike("name", name)
    .maybeSingle<{ id: string }>();

  if (existingError) {
    return NextResponse.json(
      { error: "Failed to validate uniqueness", detail: existingError.message },
      { status: 500 },
    );
  }

  if (existing) {
    return NextResponse.json({ error: "AE already exists" }, { status: 409 });
  }

  let color = requestedColor;
  if (!color) {
    const { data: existingColors } = await supabase
      .from("aes")
      .select("color")
      .returns<{ color?: string | null }[]>();

    const used = new Set(
      (existingColors ?? [])
        .map((r) => (r.color ?? "").trim())
        .filter((v) => v.length > 0),
    );

    const next = AE_MUTED_PALETTE.find((c) => !used.has(c));
    if (!next) {
      console.warn("/api/aes POST palette exhausted", {
        used: used.size,
        palette: AE_MUTED_PALETTE.length,
      });
    }
    color = next ?? AE_MUTED_PALETTE[0];
  }

  const insertedWithColor = await supabase
    .from("aes")
    .insert({ name, color })
    .select("id,name,color")
    .single<AE>();

  if (insertedWithColor.error && isMissingColumn(insertedWithColor.error)) {
    const insertedNoColor = await supabase
      .from("aes")
      .insert({ name })
      .select("id,name")
      .single<{ id: string; name: string }>();

    if (insertedNoColor.error) {
      if (isUniqueViolation(insertedNoColor.error)) {
        return NextResponse.json({ error: "AE already exists" }, { status: 409 });
      }
      console.error("/api/aes POST fallback failed", {
        message: insertedNoColor.error.message,
        code: (insertedNoColor.error as unknown as { code?: string }).code,
      });
      return NextResponse.json(
        { error: "Failed to create AE", detail: insertedNoColor.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { ...insertedNoColor.data, color },
      { status: 201 },
    );
  }

  const { data, error } = insertedWithColor;

  if (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json({ error: "AE already exists" }, { status: 409 });
    }

    console.error("/api/aes POST failed", {
      message: error.message,
      code: (error as unknown as { code?: string }).code,
    });

    return NextResponse.json(
      { error: "Failed to create AE", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const parsed = deleteQuerySchema.safeParse({ id: url.searchParams.get("id") });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const id = parsed.data.id;

  const { count, error: countError } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("ae_id", id);

  if (countError) {
    return NextResponse.json(
      { error: "Failed to check references", detail: countError.message },
      { status: 500 },
    );
  }

  const used = count ?? 0;
  if (used > 0) {
    return NextResponse.json(
      { error: "AE is in use", count: used },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from("aes")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete AE", detail: error.message },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "AE not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

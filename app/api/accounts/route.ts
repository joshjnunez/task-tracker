import { NextResponse } from "next/server";
import { z } from "zod";

import { supabase } from "@/lib/supabase";

const createSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
});

const deleteQuerySchema = z.object({
  id: z.string().uuid("id must be a UUID"),
});

type Account = { id: string; name: string };

function isUniqueViolation(error: { code?: string } | null | undefined): boolean {
  return error?.code === "23505";
}

export async function GET() {
  const { data, error } = await supabase
    .from("accounts")
    .select("id,name")
    .order("name", { ascending: true })
    .returns<Account[]>();

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch accounts", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(data ?? []);
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

  const { data: existing, error: existingError } = await supabase
    .from("accounts")
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
    return NextResponse.json({ error: "Account already exists" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("accounts")
    .insert({ name })
    .select("id,name")
    .single<Account>();

  if (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json({ error: "Account already exists" }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Failed to create account", detail: error.message },
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
    .eq("account_id", id);

  if (countError) {
    return NextResponse.json(
      { error: "Failed to check references", detail: countError.message },
      { status: 500 },
    );
  }

  const used = count ?? 0;
  if (used > 0) {
    return NextResponse.json(
      { error: "Account is in use", count: used },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete account", detail: error.message },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

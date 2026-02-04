import { NextResponse } from "next/server";
import { z } from "zod";

import { supabase } from "@/lib/supabase";
import type { TaskStatus } from "@/lib/types";

type DbTaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  ae: { name: string } | null;
  account: { name: string } | null;
};

function toApiTask(row: DbTaskRow) {
  const dueDate = row.due_date ? row.due_date.slice(0, 10) : undefined;
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    ae: row.ae?.name ?? "",
    account: row.account?.name ?? "",
    status: row.status,
    dueDate,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

const idParamSchema = z.object({
  id: z.string().uuid("id must be a UUID"),
});

const patchSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().optional().nullable(),
    ae_id: z.string().uuid().optional(),
    account_id: z.string().uuid().optional().nullable(),
    status: z.enum(["BACKLOG", "IN_PROGRESS", "WAITING", "DONE"]).optional(),
    due_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "due_date must be YYYY-MM-DD")
      .optional()
      .nullable(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields provided" });

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const params = await ctx.params;
  const idParsed = idParamSchema.safeParse(params);
  if (!idParsed.success) {
    return NextResponse.json(
      { error: "Validation error", issues: idParsed.error.issues },
      { status: 400 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const id = idParsed.data.id;

  const { data: existing, error: existingError } = await supabase
    .from("tasks")
    .select("id,status")
    .eq("id", id)
    .single<{ id: string; status: TaskStatus }>();

  if (existingError) {
    const status = existingError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json(
      {
        error: status === 404 ? "Task not found" : "Failed to load task",
        detail: existingError.message,
      },
      { status },
    );
  }

  const patch = parsed.data;

  let completed_at: string | null | undefined;
  if (patch.status) {
    if (patch.status === "DONE" && existing.status !== "DONE") {
      completed_at = new Date().toISOString();
    }
    if (patch.status !== "DONE" && existing.status === "DONE") {
      completed_at = null;
    }
  }

  const updatePayload: Record<string, unknown> = {};
  if (patch.title !== undefined) updatePayload.title = patch.title;
  if (patch.description !== undefined) updatePayload.description = patch.description;
  if (patch.ae_id !== undefined) updatePayload.ae_id = patch.ae_id;
  if (patch.account_id !== undefined) updatePayload.account_id = patch.account_id;
  if (patch.status !== undefined) updatePayload.status = patch.status;
  if (patch.due_date !== undefined) updatePayload.due_date = patch.due_date;
  if (completed_at !== undefined) updatePayload.completed_at = completed_at;

  const { data, error } = await supabase
    .from("tasks")
    .update(updatePayload)
    .eq("id", id)
    .select(
      "id,title,description,status,due_date,created_at,completed_at,ae:aes(name),account:accounts(name)",
    )
    .single<DbTaskRow>();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update task", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(toApiTask(data));
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const params = await ctx.params;
  const idParsed = idParamSchema.safeParse(params);
  if (!idParsed.success) {
    return NextResponse.json(
      { error: "Validation error", issues: idParsed.error.issues },
      { status: 400 },
    );
  }

  const id = idParsed.data.id;

  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete task", detail: error.message },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

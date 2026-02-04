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
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    ae: row.ae?.name ?? "",
    account: row.account?.name ?? "",
    status: row.status,
    dueDate: row.due_date ?? undefined,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

function sortTasks(rows: DbTaskRow[]): DbTaskRow[] {
  return [...rows].sort((a, b) => {
    const aDone = a.status === "DONE";
    const bDone = b.status === "DONE";
    if (aDone !== bDone) return aDone ? 1 : -1;

    const aDue = a.due_date;
    const bDue = b.due_date;
    if (aDue === null && bDue !== null) return 1;
    if (aDue !== null && bDue === null) return -1;
    if (aDue !== null && bDue !== null) {
      const cmp = aDue.localeCompare(bDue);
      if (cmp !== 0) return cmp;
    }

    return b.created_at.localeCompare(a.created_at);
  });
}

const createTaskSchema = z.object({
  title: z.string().trim().min(1, "title is required"),
  description: z.string().trim().optional(),
  ae_id: z.string().uuid("ae_id must be a UUID"),
  account_id: z.string().uuid("account_id must be a UUID").optional(),
  status: z.enum(["BACKLOG", "IN_PROGRESS", "WAITING", "DONE"]),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "due_date must be YYYY-MM-DD")
    .optional(),
});

export async function GET() {
  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id,title,description,status,due_date,created_at,completed_at,ae:aes(name),account:accounts(name)",
    )
    .returns<DbTaskRow[]>();

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch tasks", detail: error.message },
      { status: 500 },
    );
  }

  const sorted = sortTasks(data ?? []);
  return NextResponse.json(sorted.map(toApiTask));
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createTaskSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  const completed_at = payload.status === "DONE" ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: payload.title,
      description: payload.description ?? null,
      ae_id: payload.ae_id,
      account_id: payload.account_id ?? null,
      status: payload.status,
      due_date: payload.due_date ?? null,
      completed_at,
    })
    .select(
      "id,title,description,status,due_date,created_at,completed_at,ae:aes(name),account:accounts(name)",
    )
    .single<DbTaskRow>();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create task", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(toApiTask(data), { status: 201 });
}

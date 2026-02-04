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
  ae: z.string().trim().min(1, "ae is required").optional(),
  account: z.string().trim().optional(),
  ae_id: z.string().uuid("ae_id must be a UUID").optional(),
  account_id: z.string().uuid("account_id must be a UUID").optional().nullable(),
  status: z.enum(["BACKLOG", "IN_PROGRESS", "WAITING", "DONE"]),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "due_date must be YYYY-MM-DD")
    .optional(),
});

let didLogCreateBody = false;

async function resolveByName(params: {
  table: "aes" | "accounts";
  name: string;
}): Promise<{ id: string; name: string } | null> {
  const { data, error } = await supabase
    .from(params.table)
    .select("id,name")
    .ilike("name", params.name)
    .maybeSingle<{ id: string; name: string }>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

async function upsertByName(params: {
  table: "aes" | "accounts";
  name: string;
  label: "AE" | "Account";
}): Promise<{ id: string; name: string }> {
  const existing = await resolveByName({ table: params.table, name: params.name });
  if (existing) return existing;

  const { data, error } = await supabase
    .from(params.table)
    .insert({ name: params.name })
    .select("id,name")
    .single<{ id: string; name: string }>();

  if (error) {
    throw new Error(`${params.label} create failed: ${error.message}`);
  }

  return data;
}

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

  if (!didLogCreateBody) {
    didLogCreateBody = true;
    console.log("POST /api/tasks body (first request)", json);
  }

  const parsed = createTaskSchema.safeParse(json);
  if (!parsed.success) {
    console.warn("POST /api/tasks validation error", parsed.error.issues);
    return NextResponse.json(
      { error: "Validation error", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  let ae_id: string | undefined;
  let account_id: string | undefined;

  try {
    if (payload.ae_id) {
      ae_id = payload.ae_id;
    } else if (payload.ae) {
      ae_id = (await upsertByName({ table: "aes", name: payload.ae.trim(), label: "AE" })).id;
    }

    if (payload.account_id) {
      account_id = payload.account_id;
    } else if (payload.account && payload.account.trim().length) {
      account_id = (
        await upsertByName({
          table: "accounts",
          name: payload.account.trim(),
          label: "Account",
        })
      ).id;
    }
  } catch (e: unknown) {
    const msg = e && typeof e === "object" && "message" in e ? String(e.message) : "Unknown error";
    return NextResponse.json(
      { error: "Failed to resolve AE/Account", detail: msg },
      { status: 500 },
    );
  }

  if (!ae_id) {
    return NextResponse.json(
      { error: "Validation error", detail: "ae is required" },
      { status: 400 },
    );
  }

  const completed_at = payload.status === "DONE" ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: payload.title,
      description: payload.description ?? null,
      ae_id,
      account_id: account_id ?? null,
      status: payload.status,
      due_date: payload.due_date ?? null,
      completed_at,
    })
    .select(
      "id,title,description,status,due_date,created_at,completed_at,ae:aes(name),account:accounts(name)",
    )
    .single<DbTaskRow>();

  if (error) {
    console.error("POST /api/tasks insert failed", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return NextResponse.json(
      { error: "Failed to create task", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(toApiTask(data), { status: 201 });
}

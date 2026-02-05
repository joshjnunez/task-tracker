import type { Task, TaskFilters, TaskStatus } from "@/lib/types";
import { filterTasks } from "@/lib/taskLogic";
import { resolveAEColor } from "@/lib/aeColors";

export type TaskCreateInput = {
  title: string;
  description?: string;
  ae: string;
  account?: string;
  status: TaskStatus;
  dueDate?: string;
};

export type TaskPatch = Partial<
  Pick<Task, "title" | "description" | "ae" | "account" | "dueDate" | "status">
>;

type AppSnapshot = {
  hydrated: boolean;
  tasks: Task[];
  aes: string[];
  aeColors: Record<string, string>;
  accounts: string[];
};

type AE = { id: string; name: string; color?: string | null };
type Account = { id: string; name: string };

type ApiTask = {
  id: string;
  title: string;
  description?: string;
  ae: string;
  account: string;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string | null;
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

let snapshot: AppSnapshot = {
  hydrated: false,
  tasks: [],
  aes: [],
  aeColors: {},
  accounts: [],
};

const listeners = new Set<() => void>();
let initPromise: Promise<void> | null = null;

let aeByKey = new Map<string, AE>();
let accountByKey = new Map<string, Account>();

function notify() {
  for (const l of listeners) l();
}

function commit(next: AppSnapshot) {
  snapshot = next;
  notify();
}

async function ensureHydrated(): Promise<void> {
  await initDataProvider();
}

type ApiError = {
  status: number;
  message: string;
  body?: unknown;
};

function getApiErrorMessage(err: unknown): string {
  if (!err || typeof err !== "object") return "Unknown error";
  if ("message" in err && typeof err.message === "string") return err.message;
  return "Unknown error";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url =
    typeof window === "undefined" ? path : new URL(path, window.location.origin).toString();

  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? ((await res.json()) as unknown) : await res.text();

  if (!res.ok) {
    const message = isRecord(body) && "error" in body ? String(body.error) : `HTTP ${res.status}`;
    const err: ApiError = { status: res.status, message, body };
    throw err;
  }

  return body as T;
}

async function safeApiJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiJson<T>(path);
  } catch (e: unknown) {
    // Keep the app rendering even if the API is temporarily unavailable.
    console.warn("dataProvider init failed for", path, e);
    return fallback;
  }
}

export async function initDataProvider(): Promise<void> {
  if (typeof window === "undefined") return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const [aes, accounts, tasks] = await Promise.all([
      safeApiJson<AE[]>("/api/aes", []),
      safeApiJson<Account[]>("/api/accounts", []),
      safeApiJson<ApiTask[]>("/api/tasks", []),
    ]);

    aeByKey = new Map(aes.map((a) => [normalizeKey(a.name), a]));
    accountByKey = new Map(accounts.map((a) => [normalizeKey(a.name), a]));

    const aeColors: Record<string, string> = {};
    for (const ae of aes) {
      aeColors[ae.name] = resolveAEColor(ae.name, ae.color);
    }

    snapshot = {
      hydrated: true,
      tasks,
      aes: aes.map((a) => a.name),
      aeColors,
      accounts: accounts.map((a) => a.name),
    };

    notify();
  })();

  return initPromise;
}

async function ensureAEIdByName(name: string): Promise<string> {
  const key = normalizeKey(name);
  const existing = aeByKey.get(key);
  if (existing) return existing.id;

  let created: AE;
  try {
    created = await apiJson<AE>("/api/aes", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  } catch (e: unknown) {
    const err = e as ApiError;
    if (err.status !== 409) throw e;

    const aes = await apiJson<AE[]>("/api/aes");
    aeByKey = new Map(aes.map((a) => [normalizeKey(a.name), a]));
    const found = aeByKey.get(key);
    if (!found) throw e;

    const aeColors: Record<string, string> = {};
    for (const ae of aes) {
      aeColors[ae.name] = resolveAEColor(ae.name, ae.color);
    }
    commit({ ...snapshot, aes: aes.map((a) => a.name), aeColors });
    return found.id;
  }

  aeByKey.set(normalizeKey(created.name), created);

  const nextColors = { ...snapshot.aeColors };
  nextColors[created.name] = resolveAEColor(created.name, created.color);
  commit({
    ...snapshot,
    aes: [...snapshot.aes, created.name].sort((a, b) => a.localeCompare(b)),
    aeColors: nextColors,
  });

  return created.id;
}

async function ensureAccountIdByName(name: string): Promise<string> {
  const key = normalizeKey(name);
  const existing = accountByKey.get(key);
  if (existing) return existing.id;

  let created: Account;
  try {
    created = await apiJson<Account>("/api/accounts", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  } catch (e: unknown) {
    const err = e as ApiError;
    if (err.status !== 409) throw e;

    const accounts = await apiJson<Account[]>("/api/accounts");
    accountByKey = new Map(accounts.map((a) => [normalizeKey(a.name), a]));
    const found = accountByKey.get(key);
    if (!found) throw e;

    commit({ ...snapshot, accounts: accounts.map((a) => a.name) });
    return found.id;
  }

  accountByKey.set(normalizeKey(created.name), created);
  commit({
    ...snapshot,
    accounts: [...snapshot.accounts, created.name].sort((a, b) => a.localeCompare(b)),
  });

  return created.id;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): AppSnapshot {
  return snapshot;
}

export async function getTasks(filters: TaskFilters): Promise<Task[]> {
  await ensureHydrated();
  return filterTasks(snapshot.tasks, filters);
}

export async function createTask(input: TaskCreateInput): Promise<Task> {
  await ensureHydrated();

  const accountName = input.account && input.account.trim().length ? input.account.trim() : undefined;
  // Ensure these exist in the local caches for dropdowns without forcing the tasks API to accept ids.
  await ensureAEIdByName(input.ae);
  if (accountName) await ensureAccountIdByName(accountName);

  let created: ApiTask;
  try {
    created = await apiJson<ApiTask>("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        ae: input.ae,
        account: accountName,
        status: input.status,
        due_date: input.dueDate,
      }),
    });
  } catch (e: unknown) {
    const err = e as ApiError;
    console.error("dataProvider.createTask failed", {
      status: err.status,
      message: err.message,
      body: err.body,
    });
    throw new Error(getApiErrorMessage(e));
  }

  commit({ ...snapshot, tasks: [created, ...snapshot.tasks] });
  return created;
}

export async function updateTask(id: string, patch: TaskPatch): Promise<Task | null> {
  await ensureHydrated();

  const body: Record<string, unknown> = {};
  if (patch.title !== undefined) body.title = patch.title;
  if (patch.description !== undefined) body.description = patch.description;
  if (patch.status !== undefined) body.status = patch.status;
  if (patch.dueDate !== undefined) body.due_date = patch.dueDate ?? null;

  if (patch.ae !== undefined) {
    body.ae_id = await ensureAEIdByName(patch.ae);
  }

  if (patch.account !== undefined) {
    const trimmed = patch.account.trim();
    body.account_id = trimmed.length ? await ensureAccountIdByName(trimmed) : null;
  }

  try {
    const updated = await apiJson<ApiTask>(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });

    commit({
      ...snapshot,
      tasks: snapshot.tasks.map((t) => (t.id === id ? updated : t)),
    });

    return updated;
  } catch (e: unknown) {
    const err = e as ApiError;
    if (err.status === 404) return null;
    throw e;
  }
}

export async function deleteTask(id: string): Promise<boolean> {
  await ensureHydrated();

  try {
    await apiJson<{ ok: true }>(`/api/tasks/${id}`, { method: "DELETE" });
  } catch (e: unknown) {
    const err = e as ApiError;
    if (err.status === 404) return false;
    throw e;
  }

  commit({ ...snapshot, tasks: snapshot.tasks.filter((t) => t.id !== id) });
  return true;
}

export async function getAEs(): Promise<string[]> {
  await ensureHydrated();
  return snapshot.aes;
}

export async function createAE(name: string): Promise<void> {
  await ensureHydrated();
  const created = await apiJson<AE>("/api/aes", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

  aeByKey.set(normalizeKey(created.name), created);

  const nextColors = { ...snapshot.aeColors };
  nextColors[created.name] = resolveAEColor(created.name, created.color);
  commit({
    ...snapshot,
    aes: [...snapshot.aes, created.name].sort((a, b) => a.localeCompare(b)),
    aeColors: nextColors,
  });
}

export async function deleteAE(id: string): Promise<boolean> {
  await ensureHydrated();
  const key = normalizeKey(id);
  const ae = aeByKey.get(key);
  if (!ae) return false;

  await apiJson<{ ok: true }>(`/api/aes?id=${encodeURIComponent(ae.id)}`, {
    method: "DELETE",
  });

  aeByKey.delete(key);
  commit({ ...snapshot, aes: snapshot.aes.filter((v) => normalizeKey(v) !== key) });
  return true;
}

export async function reconcileAEColors(): Promise<{ changed: number }> {
  await ensureHydrated();

  const res = await apiJson<{ ok: true; changed: number }>("/api/aes/reconcile-colors", {
    method: "POST",
  });

  const aes = await apiJson<AE[]>("/api/aes");
  aeByKey = new Map(aes.map((a) => [normalizeKey(a.name), a]));

  const aeColors: Record<string, string> = {};
  for (const ae of aes) {
    aeColors[ae.name] = resolveAEColor(ae.name, ae.color);
  }

  commit({
    ...snapshot,
    aes: aes.map((a) => a.name),
    aeColors,
  });

  return { changed: res.changed };
}

export async function getAccounts(): Promise<string[]> {
  await ensureHydrated();
  return snapshot.accounts;
}

export async function createAccount(name: string): Promise<void> {
  await ensureHydrated();
  const created = await apiJson<Account>("/api/accounts", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

  accountByKey.set(normalizeKey(created.name), created);
  commit({
    ...snapshot,
    accounts: [...snapshot.accounts, created.name].sort((a, b) => a.localeCompare(b)),
  });
}

export async function deleteAccount(id: string): Promise<boolean> {
  await ensureHydrated();
  const key = normalizeKey(id);
  const account = accountByKey.get(key);
  if (!account) return false;

  await apiJson<{ ok: true }>(`/api/accounts?id=${encodeURIComponent(account.id)}`, {
    method: "DELETE",
  });

  accountByKey.delete(key);
  commit({
    ...snapshot,
    accounts: snapshot.accounts.filter((v) => normalizeKey(v) !== key),
  });
  return true;
}

import type { Task, TaskFilters, TaskStatus } from "@/lib/types";

const STATUSES: TaskStatus[] = ["BACKLOG", "IN_PROGRESS", "WAITING", "DONE"];

export function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case "BACKLOG":
      return "Backlog";
    case "IN_PROGRESS":
      return "In Progress";
    case "WAITING":
      return "Waiting";
    case "DONE":
      return "Done";
  }
}

export function getAllStatuses(): TaskStatus[] {
  return STATUSES;
}

export function normalizeFilters(filters: TaskFilters): TaskFilters {
  return {
    query: filters.query ?? "",
    ae: filters.ae ?? "ALL",
    account: filters.account ?? "ALL",
    status: filters.status ?? "ALL",
  };
}

export function applyStatusLogic(task: Task, nextStatus: TaskStatus): Task {
  const nowIso = new Date().toISOString();

  if (nextStatus === "DONE") {
    return {
      ...task,
      status: nextStatus,
      completedAt: task.completedAt ?? nowIso,
    };
  }

  return {
    ...task,
    status: nextStatus,
    completedAt: null,
  };
}

export function isCompleted(task: Task): boolean {
  return task.status === "DONE";
}

function compareDueDate(a?: string, b?: string): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
}

export function sortActiveTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const due = compareDueDate(a.dueDate, b.dueDate);
    if (due !== 0) return due;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function sortCompletedTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const aKey = a.completedAt ?? a.createdAt;
    const bKey = b.completedAt ?? b.createdAt;
    return bKey.localeCompare(aKey);
  });
}

export function sortTasks(tasks: Task[]): { active: Task[]; completed: Task[] } {
  const active = tasks.filter((t) => !isCompleted(t));
  const completed = tasks.filter((t) => isCompleted(t));

  return {
    active: sortActiveTasks(active),
    completed: sortCompletedTasks(completed),
  };
}

export function deriveAEs(tasks: Task[]): string[] {
  return Array.from(new Set(tasks.map((t) => t.ae).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function deriveAccounts(tasks: Task[]): string[] {
  return Array.from(new Set(tasks.map((t) => t.account).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  const f = normalizeFilters(filters);
  const q = f.query.trim().toLowerCase();

  return tasks.filter((t) => {
    if (q && !t.title.toLowerCase().includes(q)) return false;
    if (f.ae !== "ALL" && t.ae !== f.ae) return false;
    if (f.account !== "ALL" && t.account !== f.account) return false;
    if (f.status !== "ALL" && t.status !== f.status) return false;
    return true;
  });
}

export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function seedTasks(): Task[] {
  const now = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();
  const date = (ms: number) => new Date(ms).toISOString().slice(0, 10);

  const base: Omit<Task, "id">[] = [
    {
      title: "Prep QBR deck",
      description: "Collect metrics and last quarter highlights.",
      ae: "Ava",
      account: "Acme",
      status: "IN_PROGRESS",
      dueDate: date(now + 3 * 86400000),
      createdAt: iso(now - 5 * 86400000),
      completedAt: null,
    },
    {
      title: "Follow up on renewal pricing",
      description: "Confirm discount band and send proposal.",
      ae: "Ava",
      account: "Northwind",
      status: "WAITING",
      dueDate: date(now + 5 * 86400000),
      createdAt: iso(now - 7 * 86400000),
      completedAt: null,
    },
    {
      title: "Schedule technical deep dive",
      description: "Align SE + customer engineering team.",
      ae: "Milo",
      account: "Globex",
      status: "BACKLOG",
      dueDate: undefined,
      createdAt: iso(now - 2 * 86400000),
      completedAt: null,
    },
    {
      title: "Send meeting recap",
      description: "Include next steps and owners.",
      ae: "Milo",
      account: "Initech",
      status: "BACKLOG",
      dueDate: date(now + 1 * 86400000),
      createdAt: iso(now - 1 * 86400000),
      completedAt: null,
    },
    {
      title: "Confirm legal redlines",
      description: "Review latest version and reply.",
      ae: "Noah",
      account: "Umbrella",
      status: "IN_PROGRESS",
      dueDate: date(now + 7 * 86400000),
      createdAt: iso(now - 9 * 86400000),
      completedAt: null,
    },
    {
      title: "Update CRM notes",
      description: "Capture stakeholder map and risks.",
      ae: "Noah",
      account: "Acme",
      status: "BACKLOG",
      dueDate: undefined,
      createdAt: iso(now - 3 * 86400000),
      completedAt: null,
    },
    {
      title: "Close out onboarding checklist",
      description: "Confirm deliverables are complete.",
      ae: "Ava",
      account: "Globex",
      status: "DONE",
      dueDate: date(now - 2 * 86400000),
      createdAt: iso(now - 14 * 86400000),
      completedAt: iso(now - 2 * 86400000),
    },
    {
      title: "Share security questionnaire",
      description: "Send latest SOC2 + answers.",
      ae: "Milo",
      account: "Northwind",
      status: "DONE",
      dueDate: date(now - 6 * 86400000),
      createdAt: iso(now - 20 * 86400000),
      completedAt: iso(now - 6 * 86400000),
    },
    {
      title: "Draft expansion pitch",
      description: "Outline value props and timeline.",
      ae: "Noah",
      account: "Initech",
      status: "IN_PROGRESS",
      dueDate: date(now + 10 * 86400000),
      createdAt: iso(now - 4 * 86400000),
      completedAt: null,
    },
  ];

  return base.map((t) => ({ ...t, id: makeId() }));
}

export const STORAGE_KEY = "task-tracker.tasks.v1";

export function loadTasksFromStorage(): Task[] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Task[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveTasksToStorage(tasks: Task[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // ignore
  }
}

import type { Task } from "@/lib/types";
import { seedTasks } from "@/lib/taskLogic";

export const TASKS_KEY_V1 = "task-tracker.tasks.v1";
export const TASKS_KEY = "task-tracker.tasks.v2";
export const AE_LIST_KEY = "task-tracker.aes.v1";
export const ACCOUNT_LIST_KEY = "task-tracker.accounts.v1";

export type ManagedLists = {
  aes: string[];
  accounts: string[];
};

export function seedManagedLists(): ManagedLists {
  return {
    aes: ["Ava", "Milo", "Noah"],
    accounts: [
      "Acme",
      "Northwind",
      "Globex",
      "Initech",
      "Umbrella",
      "Soylent",
      "Stark",
      "Wayne",
    ],
  };
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function loadTasks(): Task[] | null {
  const v2 = readJson<Task[]>(TASKS_KEY);
  if (Array.isArray(v2)) return v2;

  const v1 = readJson<Task[]>(TASKS_KEY_V1);
  if (Array.isArray(v1)) return v1;

  return null;
}

export function saveTasks(tasks: Task[]): void {
  writeJson(TASKS_KEY, tasks);
}

export function loadAEList(): string[] | null {
  const aes = readJson<string[]>(AE_LIST_KEY);
  return Array.isArray(aes) ? aes : null;
}

export function saveAEList(aes: string[]): void {
  writeJson(AE_LIST_KEY, aes);
}

export function loadAccountList(): string[] | null {
  const accounts = readJson<string[]>(ACCOUNT_LIST_KEY);
  return Array.isArray(accounts) ? accounts : null;
}

export function saveAccountList(accounts: string[]): void {
  writeJson(ACCOUNT_LIST_KEY, accounts);
}

export function initializeAppData(): { tasks: Task[]; aes: string[]; accounts: string[] } {
  const seededLists = seedManagedLists();

  const aes = loadAEList() ?? seededLists.aes;
  const accounts = loadAccountList() ?? seededLists.accounts;

  const storedTasks = loadTasks();
  const tasks = storedTasks && storedTasks.length > 0 ? storedTasks : seedTasks();

  saveAEList(aes);
  saveAccountList(accounts);
  saveTasks(tasks);

  return { tasks, aes, accounts };
}

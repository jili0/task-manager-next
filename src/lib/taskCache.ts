// src/lib/taskCache.ts
import { ITask } from "@/types";

const KEY_PREFIX = "task-cache:";
const LAST_USER_KEY = "task-cache-last-user";
const keyFor = (userId: string) => `${KEY_PREFIX}${userId}`;

// Cache holds only the active tasks shown on the main page.
// History (isDone=true) is server-only.
export type TaskCacheEntry = { tasks: ITask[]; savedAt: number };

export const loadTasksCache = (userId: string): TaskCacheEntry | null => {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Legacy schema: bare array — treat as ancient so freshness check forces refetch.
    if (Array.isArray(parsed)) return { tasks: parsed as ITask[], savedAt: 0 };
    if (
      parsed &&
      Array.isArray(parsed.tasks) &&
      typeof parsed.savedAt === "number"
    ) {
      return parsed as TaskCacheEntry;
    }
    return null;
  } catch {
    return null;
  }
};

export const saveTasksCache = (userId: string, tasks: ITask[]): void => {
  try {
    if (typeof window === "undefined") return;
    const active = tasks.filter((t) => !t.isDone);
    const entry: TaskCacheEntry = { tasks: active, savedAt: Date.now() };
    localStorage.setItem(keyFor(userId), JSON.stringify(entry));
    localStorage.setItem(LAST_USER_KEY, userId);
  } catch {
    // quota exceeded / storage unavailable — swallow
  }
};

// Pointer to whichever user last cached tasks in this browser. Lets the
// main page paint cached tasks before NextAuth's session fetch resolves.
export const loadLastUserId = (): string | null => {
  try {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(LAST_USER_KEY);
  } catch {
    return null;
  }
};

export const clearAllTaskCaches = (): void => {
  try {
    if (typeof window === "undefined") return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith(KEY_PREFIX) || k === LAST_USER_KEY)
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
};

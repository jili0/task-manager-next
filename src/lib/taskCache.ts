// src/lib/taskCache.ts
import { ITask } from "@/types";

const KEY_PREFIX = "task-cache:";
const keyFor = (userId: string) => `${KEY_PREFIX}${userId}`;

// Cache holds only the active tasks shown on the main page.
// History (isDone=true) is server-only.
export const loadTasksCache = (userId: string): ITask[] | null => {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ITask[]) : null;
  } catch {
    return null;
  }
};

export const saveTasksCache = (userId: string, tasks: ITask[]): void => {
  try {
    if (typeof window === "undefined") return;
    const active = tasks.filter((t) => !t.isDone);
    localStorage.setItem(keyFor(userId), JSON.stringify(active));
  } catch {
    // quota exceeded / storage unavailable — swallow
  }
};

export const clearAllTaskCaches = (): void => {
  try {
    if (typeof window === "undefined") return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith(KEY_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
};

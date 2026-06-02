// src/lib/syncQueue.ts
import { ITask } from "@/types";

export type SyncOp =
  | {
      type: "add";
      tempId: string;
      payload: { date: string; time: string; text: string };
    }
  | { type: "update"; taskId: string; payload: ITask }
  | { type: "toggle"; taskId: string };

const KEY_PREFIX = "task-sync-queue:";
const keyFor = (userId: string) => `${KEY_PREFIX}${userId}`;

export const loadQueue = (userId: string): SyncOp[] => {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SyncOp[]) : [];
  } catch {
    return [];
  }
};

export const saveQueue = (userId: string, ops: SyncOp[]): void => {
  try {
    if (typeof window === "undefined") return;
    if (ops.length === 0) localStorage.removeItem(keyFor(userId));
    else localStorage.setItem(keyFor(userId), JSON.stringify(ops));
  } catch {
    // quota / unavailable — swallow
  }
};

export const clearAllQueues = (): void => {
  try {
    if (typeof window === "undefined") return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith(KEY_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
};

// fetch() throws TypeError on network failure (offline, DNS error, CORS).
// Anything else (HTTP 4xx/5xx) returns a Response — that's a real error
// the user needs to see, not something to retry silently.
export const isNetworkError = (e: unknown): boolean => e instanceof TypeError;

export const tempTaskId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `temp:${crypto.randomUUID()}`;
  }
  return `temp:${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const isTempId = (id: string): boolean => id.startsWith("temp:");

import { ITask, TaskFormData } from "@/types";

export type SyncOp =
  | { type: "add"; tempId: string; payload: TaskFormData }
  | { type: "update"; taskId: string; payload: ITask }
  | { type: "setDone"; taskId: string; isDone: boolean };

const KEY_PREFIX = "task-sync-queue:";
const keyFor = (userId: string) => `${KEY_PREFIX}${userId}`;

const migrate = (op: unknown): SyncOp | null => {
  if (!op || typeof op !== "object") return null;
  const o = op as Record<string, unknown>;
  if (o.type === "toggle" && typeof o.taskId === "string") {
    return { type: "setDone", taskId: o.taskId, isDone: true };
  }
  if (o.type === "add" || o.type === "update" || o.type === "setDone") {
    return op as SyncOp;
  }
  return null;
};

export const loadQueue = (userId: string): SyncOp[] => {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(migrate).filter((op): op is SyncOp => op !== null);
  } catch {
    return [];
  }
};

export const saveQueue = (userId: string, ops: SyncOp[]): void => {
  try {
    if (typeof window === "undefined") return;
    if (ops.length === 0) localStorage.removeItem(keyFor(userId));
    else localStorage.setItem(keyFor(userId), JSON.stringify(ops));
  } catch {}
};

export const clearAllQueues = (): void => {
  try {
    if (typeof window === "undefined") return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith(KEY_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
};

export const isNetworkError = (e: unknown): boolean => e instanceof TypeError;

export class PermanentSyncError extends Error {
  readonly permanent = true;
  constructor(message: string) {
    super(message);
    this.name = "PermanentSyncError";
  }
}

export const tempTaskId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `temp:${crypto.randomUUID()}`;
  }
  return `temp:${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const isTempId = (id: string): boolean => id.startsWith("temp:");

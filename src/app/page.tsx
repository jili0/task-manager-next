"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import TaskList from "@/components/TaskList";
import { ITask, TaskFormData } from "@/types";
import { sortTasks } from "@/lib/utils";
import { createCache } from "@/lib/localCache";
import {
  PermanentSyncError,
  SyncOp,
  isNetworkError,
  isTempId,
  loadQueue,
  saveQueue,
  tempTaskId,
} from "@/lib/syncQueue";

const tasksCache = createCache<ITask>("tasks");

const BANNER_DELAY_MS = 600;
const RETRY_BASE_MS = 5_000;
const RETRY_MAX_MS = 60_000;

const Home = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = session?.user?.id;

  const [tasks, setTasks] = useState<ITask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [retryTick, setRetryTick] = useState(0);

  const syncingRef = useRef<Promise<void> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttemptRef = useRef(0);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    const id = setTimeout(
      () => setBannerVisible(pendingCount > 0),
      pendingCount > 0 ? BANNER_DELAY_MS : 0
    );
    return () => clearTimeout(id);
  }, [pendingCount]);

  const persistTasks = useCallback(
    (updater: (prev: ITask[]) => ITask[]) => {
      setTasks((prev) => {
        const next = updater(prev);
        if (userId) tasksCache.save(userId, next.filter((t) => !t.isDone));
        return next;
      });
    },
    [userId]
  );

  const persistQueue = useCallback(
    (next: SyncOp[]) => {
      if (!userId) return;
      saveQueue(userId, next);
      setPendingCount(next.length);
    },
    [userId]
  );

  const failFor = useCallback(
    async (res: Response, fallback: string): Promise<never> => {
      if (res.status === 401) {
        router.push("/login");
        throw new Error("Not signed in");
      }
      const msg = await res
        .json()
        .then((b) => b?.error || fallback)
        .catch(() => fallback);
      if (res.status >= 400 && res.status < 500) {
        throw new PermanentSyncError(`${res.status}: ${msg}`);
      }
      throw new Error(`${res.status}: ${msg}`);
    },
    [router]
  );

  const processOp = useCallback(
    async (op: SyncOp, queue: SyncOp[]): Promise<SyncOp[]> => {
      if (op.type === "add") {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(op.payload),
        });
        if (!res.ok) await failFor(res, "Create failed");
        const real: ITask = await res.json();
        persistTasks((prev) =>
          sortTasks(prev.map((t) => (t._id === op.tempId ? real : t)))
        );
        return queue.slice(1).map((q) =>
          "taskId" in q && q.taskId === op.tempId
            ? { ...q, taskId: real._id as string }
            : q
        );
      }

      if (isTempId(op.taskId)) {
        throw new PermanentSyncError(`Orphaned operation for ${op.taskId}`);
      }

      const res =
        op.type === "update"
          ? await fetch(`/api/tasks/${op.taskId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(op.payload),
            })
          : await fetch(`/api/tasks/${op.taskId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isDone: op.isDone }),
            });
      if (!res.ok) await failFor(res, "Save failed");
      const data: ITask = await res.json();
      persistTasks((prev) =>
        sortTasks(prev.map((t) => (t._id === data._id ? data : t)))
      );
      return queue.slice(1);
    },
    [failFor, persistTasks]
  );

  const runSync = useCallback((): Promise<void> => {
    if (!userId) return Promise.resolve();
    if (syncingRef.current) return syncingRef.current;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    const run = async () => {
      let queue = loadQueue(userId);
      while (queue.length > 0) {
        const op = queue[0];
        let rest: SyncOp[];
        try {
          rest = await processOp(op, queue);
          retryAttemptRef.current = 0;
          setSyncFailed(false);
        } catch (e) {
          if (e instanceof PermanentSyncError) {
            if (op.type === "add") {
              persistTasks((prev) => prev.filter((t) => t._id !== op.tempId));
            }
            rest = queue.slice(1);
          } else {
            setSyncFailed(true);
            const delay = Math.min(
              RETRY_BASE_MS * 2 ** retryAttemptRef.current,
              RETRY_MAX_MS
            );
            retryAttemptRef.current += 1;
            retryTimerRef.current = setTimeout(() => {
              retryTimerRef.current = null;
              setRetryTick((t) => t + 1);
            }, delay);
            return;
          }
        }
        queue = rest;
        persistQueue(queue);
      }
      setSyncFailed(false);
    };
    syncingRef.current = run().finally(() => {
      syncingRef.current = null;
    });
    return syncingRef.current;
  }, [userId, processOp, persistTasks, persistQueue]);

  const applyServerTasks = useCallback(
    (data: ITask[], uid: string) => {
      const pendingIds = new Set<string>();
      for (const op of loadQueue(uid)) {
        pendingIds.add(op.type === "add" ? op.tempId : op.taskId);
      }
      persistTasks((prev) => {
        const localById = new Map(prev.map((t) => [t._id as string, t]));
        const serverIds = new Set(data.map((t) => t._id));
        const merged = data.map((t) =>
          t._id && pendingIds.has(t._id) ? (localById.get(t._id) ?? t) : t
        );
        const localOnly = prev.filter(
          (t) => t._id && !serverIds.has(t._id) && pendingIds.has(t._id)
        );
        return sortTasks([...merged, ...localOnly]);
      });
    },
    [persistTasks]
  );

  useEffect(() => {
    if (status !== "authenticated" || !userId) return;

    let cancelled = false;
    const cachedTasks = tasksCache.load(userId);
    (async () => {
      if (cachedTasks) {
        setTasks(sortTasks(cachedTasks.items));
        if (cachedTasks.items.length > 0) setInitialLoading(false);
      }
      setPendingCount(loadQueue(userId).length);

      await runSync();
      if (cancelled) return;

      try {
        const res = await fetch("/api/tasks?done=false");
        if (res.status === 401) return router.push("/login");
        if (!res.ok) {
          throw new Error((await res.json()).error || "Could not load tasks");
        }
        const data: ITask[] = await res.json();
        if (!cancelled) applyServerTasks(data, userId);
      } catch (e) {
        if (!cancelled && !cachedTasks && !isNetworkError(e)) {
          setError(e instanceof Error ? e.message : "Could not reach the server");
        }
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, userId, router, runSync, applyServerTasks]);

  useEffect(() => {
    if (retryTick > 0) runSync();
  }, [retryTick, runSync]);

  useEffect(() => {
    if (!userId) return;
    const onOnline = () => runSync();
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("online", onOnline);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [userId, runSync]);

  const enqueue = (op: SyncOp) => {
    if (!userId) return;
    persistQueue([...loadQueue(userId), op]);
    runSync();
  };

  const addTask = (newTask: TaskFormData) => {
    if (!userId) return;
    const tempId = tempTaskId();
    persistTasks((prev) =>
      sortTasks([...prev, { _id: tempId, ...newTask, isDone: false, userId }])
    );
    enqueue({ type: "add", tempId, payload: newTask });
  };

  const updateTask = (updated: ITask) => {
    if (!userId || !updated._id) return;
    persistTasks((prev) =>
      sortTasks(prev.map((t) => (t._id === updated._id ? updated : t)))
    );
    enqueue({ type: "update", taskId: updated._id, payload: updated });
  };

  const markDone = (taskId: string) => {
    if (!userId) return;
    persistTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, isDone: true } : t))
    );
    enqueue({ type: "setDone", taskId, isDone: true });
  };

  if (status !== "authenticated") return null;

  return (
    <div className="app-container">
      <Header
        currentPage="home"
        userName={session?.user?.name || ""}
      />
      {bannerVisible && pendingCount > 0 && (
        <div className="pending-banner">
          <p>
            {pendingCount === 1
              ? "1 change waiting to sync."
              : `${pendingCount} changes waiting to sync.`}
          </p>
          {syncFailed && (
            <button onClick={() => runSync()}>Retry now</button>
          )}
        </div>
      )}
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      <div className="container">
        <TaskList
          tasks={tasks}
          mode="main"
          loading={initialLoading}
          onAddTask={addTask}
          onUpdateTask={updateTask}
          onToggleTaskDone={markDone}
        />
      </div>
    </div>
  );
};

export default Home;

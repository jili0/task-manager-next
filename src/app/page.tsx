// src/app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import TaskList from "@/components/TaskList";
import { ITask } from "@/types";
import { sortTasks } from "@/lib/utils";
import { loadTasksCache, saveTasksCache } from "@/lib/taskCache";
import {
  SyncOp,
  isNetworkError,
  isTempId,
  loadQueue,
  saveQueue,
  tempTaskId,
} from "@/lib/syncQueue";
import "@/styles/styles.css";

const Home = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = (session?.user as any)?.id as string | undefined;

  const [tasks, setTasks] = useState<ITask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const syncingRef = useRef<boolean>(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // setState + cache persist in one shot (functional setter so chained calls
  // never race on a stale `tasks` closure).
  const persistTasks = (updater: (prev: ITask[]) => ITask[]) => {
    setTasks((prev) => {
      const next = updater(prev);
      if (userId) saveTasksCache(userId, next);
      return next;
    });
  };

  const persistQueue = (next: SyncOp[]) => {
    if (!userId) return;
    saveQueue(userId, next);
    setPendingCount(next.length);
  };

  const enqueue = (op: SyncOp) => {
    if (!userId) return;
    persistQueue([...loadQueue(userId), op]);
  };

  // Process queue ops in order. A network failure pauses the loop and leaves
  // the op at the front of the queue — the banner stays up until a later
  // sync attempt (online event or next mount) succeeds.
  const runSync = async () => {
    if (!userId || syncingRef.current) return;
    syncingRef.current = true;
    try {
      let queue = loadQueue(userId);
      while (queue.length > 0) {
        const op = queue[0];
        let rest: SyncOp[];
        try {
          rest = await processOp(op, queue);
        } catch {
          // Either way we pause and retry later. We don't log here because
          // Next.js dev overlay surfaces console.error, and the pending
          // banner is the only signal the user needs. (HTTP failures —
          // e.g. dev server reachable but Mongo Atlas is not when the
          // browser is offline — also fall through here and get retried.)
          return;
        }
        queue = rest;
        persistQueue(queue);
      }
    } finally {
      syncingRef.current = false;
    }
  };

  const processOp = async (op: SyncOp, queue: SyncOp[]): Promise<SyncOp[]> => {
    if (op.type === "add") {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(op.payload),
      });
      if (res.status === 401) {
        router.push("/login");
        throw new Error("Not authenticated");
      }
      if (!res.ok) throw new Error((await res.json()).error || "Add failed");
      const real: ITask = await res.json();
      persistTasks((prev) =>
        sortTasks(prev.map((t) => (t._id === op.tempId ? real : t)))
      );
      // Rewrite the rest of the queue: anything still pointing at the temp ID
      // now needs to address the real ID.
      return queue.slice(1).map((q) =>
        "taskId" in q && q.taskId === op.tempId
          ? { ...q, taskId: real._id as string }
          : q
      );
    }
    if (op.type === "update") {
      const res = await fetch(`/api/tasks/${op.taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(op.payload),
      });
      if (res.status === 401) {
        router.push("/login");
        throw new Error("Not authenticated");
      }
      if (!res.ok) throw new Error((await res.json()).error || "Update failed");
      const data: ITask = await res.json();
      persistTasks((prev) =>
        sortTasks(prev.map((t) => (t._id === data._id ? data : t)))
      );
      return queue.slice(1);
    }
    // toggle
    const res = await fetch(`/api/tasks/${op.taskId}`, { method: "PATCH" });
    if (res.status === 401) {
      router.push("/login");
      throw new Error("Not authenticated");
    }
    if (!res.ok) throw new Error((await res.json()).error || "Toggle failed");
    const data: ITask = await res.json();
    persistTasks((prev) => prev.map((t) => (t._id === data._id ? data : t)));
    return queue.slice(1);
  };

  // Initial load: cache (sync), then flush queue, then fetch authoritative
  // server data. Each step independent — failures don't block the next.
  useEffect(() => {
    if (status !== "authenticated" || !userId) return;

    const cached = loadTasksCache(userId);
    if (cached && cached.length > 0) setTasks(sortTasks(cached));
    setPendingCount(loadQueue(userId).length);

    (async () => {
      await runSync();
      try {
        const res = await fetch("/api/tasks");
        if (res.status === 401) return router.push("/login");
        if (!res.ok) {
          throw new Error((await res.json()).error || "Failed to load tasks");
        }
        const data: ITask[] = await res.json();
        persistTasks((prev) => {
          // Server is authoritative for shared IDs. Keep local-only tasks
          // (temp ones still in queue, or just-synced reals the GET request
          // may have missed due to request ordering).
          const serverIds = new Set(data.map((t) => t._id));
          const local = prev.filter((t) => t._id && !serverIds.has(t._id));
          return sortTasks([...data, ...local]);
        });
      } catch (e) {
        // Suppress if cache already populated the screen, or if it's just
        // a network hiccup — banner / cached UI already conveys state.
        if ((!cached || cached.length === 0) && !isNetworkError(e)) {
          setError(
            e instanceof Error ? e.message : "Error connecting to the server"
          );
        }
      }
    })();
  }, [status, userId, router]);

  // Retry sync as soon as the browser reports network is back.
  useEffect(() => {
    if (!userId) return;
    const onOnline = () => runSync();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [userId]);

  const taskApi = {
    addTask: (newTask: { date: string; time: string; text: string }) => {
      if (!userId) return;
      const tempId = tempTaskId();
      const optimistic: ITask = {
        _id: tempId,
        date: newTask.date || "",
        time: newTask.time || "",
        text: newTask.text || "",
        isDone: false,
        userId,
      };
      persistTasks((prev) => sortTasks([...prev, optimistic]));
      enqueue({ type: "add", tempId, payload: newTask });
      runSync();
    },

    updateTask: (updated: ITask) => {
      if (!userId || !updated._id) return;
      persistTasks((prev) =>
        sortTasks(prev.map((t) => (t._id === updated._id ? updated : t)))
      );
      enqueue({ type: "update", taskId: updated._id, payload: updated });
      runSync();
    },

    toggleTaskDone: (taskId: string) => {
      if (!userId) return;
      persistTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, isDone: !t.isDone } : t))
      );
      enqueue({ type: "toggle", taskId });
      runSync();
    },
  };

  if (status === "unauthenticated") return null;

  const headerButtons = [
    { label: "Print", onClick: () => window.print() },
    { label: "JourFix", onClick: () => router.push("/jourfix") },
    { label: "History", onClick: () => router.push("/history") },
  ];

  return (
    <div className="app-container">
      <Header
        title="Tasks"
        buttons={headerButtons}
        userName={session?.user?.name || ""}
      />
      {pendingCount > 0 && (
        <div className="pending-banner">
          <p>
            {pendingCount === 1
              ? "1 Änderung wartet auf Synchronisierung."
              : `${pendingCount} Änderungen warten auf Synchronisierung.`}
          </p>
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
          onAddTask={taskApi.addTask}
          onUpdateTask={taskApi.updateTask}
          onToggleTaskDone={taskApi.toggleTaskDone}
        />
      </div>
    </div>
  );
};

export default Home;

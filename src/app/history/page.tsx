"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import TaskList from "@/components/TaskList";
import { ITask } from "@/types";
import { sortTasks } from "@/lib/utils";
import { createCache } from "@/lib/localCache";
import { loadQueue } from "@/lib/syncQueue";

const historyCache = createCache<ITask>("history");
const tasksCache = createCache<ITask>("tasks");

const History = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = session?.user?.id;

  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !userId) return;

    let cancelled = false;
    const cached = historyCache.load(userId);
    (async () => {
      if (cached) {
        setTasks(sortTasks(cached.items));
        if (cached.items.length > 0) setLoading(false);
      }
      setPendingCount(loadQueue(userId).length);
      try {
        const res = await fetch("/api/tasks?done=true");
        if (res.status === 401) return router.push("/login");
        if (!res.ok) {
          throw new Error(
            (await res.json()).error || "Could not load history"
          );
        }
        const data: ITask[] = await res.json();
        if (cancelled) return;
        setTasks(sortTasks(data));
        historyCache.save(userId, data);
      } catch (e) {
        if (!cancelled && !cached) {
          setError(
            e instanceof TypeError
              ? "Offline: history is not available without a connection."
              : e instanceof Error
                ? e.message
                : "Could not reach the server"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, userId, router]);

  const persist = (updater: (prev: ITask[]) => ITask[]) => {
    setTasks((prev) => {
      const next = updater(prev);
      if (userId) historyCache.save(userId, next);
      return next;
    });
  };

  const request = async (
    url: string,
    init: RequestInit,
    fallback: string
  ): Promise<ITask | null> => {
    setError(null);
    try {
      const res = await fetch(url, init);
      if (res.status === 401) {
        router.push("/login");
        return null;
      }
      if (!res.ok) {
        setError((await res.json()).error || fallback);
        return null;
      }
      return (await res.json()) as ITask;
    } catch (e) {
      setError(
        e instanceof TypeError
          ? "Offline: changes in history need a connection."
          : fallback
      );
      return null;
    }
  };

  const json = (body: unknown): RequestInit => ({
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const deleteTask = async (taskId: string) => {
    if (!window.confirm("Delete permanently?")) return;
    const result = await request(
      `/api/tasks/${taskId}`,
      { method: "DELETE" },
      "Delete failed"
    );
    if (result) persist((prev) => prev.filter((t) => t._id !== taskId));
  };

  const undoTask = async (taskId: string) => {
    const restored = await request(
      `/api/tasks/${taskId}`,
      { method: "PATCH", ...json({ isDone: false }) },
      "Restore failed"
    );
    if (!restored) return;
    persist((prev) => prev.filter((t) => t._id !== taskId));
    if (userId) {
      const cached = tasksCache.load(userId);
      if (cached) {
        tasksCache.save(userId, sortTasks([...cached.items, restored]));
      }
    }
  };

  const updateTask = async (updatedTask: ITask) => {
    const saved = await request(
      `/api/tasks/${updatedTask._id}`,
      { method: "PUT", ...json(updatedTask) },
      "Save failed"
    );
    if (saved) {
      persist((prev) =>
        sortTasks(prev.map((t) => (t._id === saved._id ? saved : t)))
      );
    }
  };

  if (status !== "authenticated") return null;

  return (
    <div className="app-container">
      <Header
        currentPage="history"
        userName={session?.user?.name || ""}
      />
      {pendingCount > 0 && (
        <div className="pending-banner">
          <p>
            {pendingCount === 1
              ? "1 change from the home page is not synced yet."
              : `${pendingCount} changes from the home page are not synced yet.`}
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
          tasks={tasks.slice().reverse()}
          mode="history"
          loading={loading}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
          onUndoTask={undoTask}
        />
      </div>
    </div>
  );
};

export default History;

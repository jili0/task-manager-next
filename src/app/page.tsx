// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import TaskList from "@/components/TaskList";
import { ITask } from "@/types";
import { sortTasks } from "@/lib/utils";
import { loadTasksCache, saveTasksCache } from "@/lib/taskCache";
import "@/styles/styles.css";

const Home = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = (session?.user as any)?.id as string | undefined;

  const [tasks, setTasks] = useState<ITask[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Once we know who we are: read cache synchronously, then sync with server
  // in the background. Cache failure must not block the fetch.
  useEffect(() => {
    if (status !== "authenticated" || !userId) return;

    const cached = loadTasksCache(userId);
    if (cached && cached.length > 0) setTasks(sortTasks(cached));

    (async () => {
      try {
        const res = await fetch("/api/tasks");
        if (res.status === 401) return router.push("/login");
        if (!res.ok) {
          throw new Error((await res.json()).error || "Failed to load tasks");
        }
        const data: ITask[] = await res.json();
        setTasks(data);
        saveTasksCache(userId, data);
      } catch (e) {
        // Stay silent if we already have something cached on screen
        if (!cached || cached.length === 0) {
          setError(
            e instanceof Error ? e.message : "Error connecting to the server"
          );
        }
      }
    })();
  }, [status, userId, router]);

  // setState + cache persist in one shot, using functional updates so chained
  // mutations don't race on a stale `tasks` closure.
  const persistTasks = (updater: (prev: ITask[]) => ITask[]) => {
    setTasks((prev) => {
      const next = updater(prev);
      if (userId) saveTasksCache(userId, next);
      return next;
    });
  };

  const taskApi = {
    addTask: async (newTask: any) => {
      try {
        setError(null);
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTask),
        });
        if (res.status === 401) return router.push("/login");
        if (!res.ok) {
          throw new Error((await res.json()).error || "Failed to add task");
        }
        const data = await res.json();
        persistTasks((prev) => sortTasks([...prev, data]));
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Error connecting to the server"
        );
      }
    },

    updateTask: async (updated: ITask) => {
      try {
        setError(null);
        const res = await fetch(`/api/tasks/${updated._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
        if (res.status === 401) return router.push("/login");
        if (!res.ok) {
          throw new Error((await res.json()).error || "Failed to update task");
        }
        const data = await res.json();
        persistTasks((prev) =>
          sortTasks(prev.map((t) => (t._id === data._id ? data : t)))
        );
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Error connecting to the server"
        );
      }
    },

    toggleTaskDone: async (taskId: string) => {
      try {
        setError(null);
        const res = await fetch(`/api/tasks/${taskId}`, { method: "PATCH" });
        if (res.status === 401) return router.push("/login");
        if (!res.ok) {
          throw new Error((await res.json()).error || "Failed to toggle task");
        }
        const data = await res.json();
        persistTasks((prev) =>
          prev.map((t) => (t._id === data._id ? data : t))
        );
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Error connecting to the server"
        );
      }
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

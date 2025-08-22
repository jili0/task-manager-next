// src/app/history/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import TaskList from "@/components/TaskList";
import { ITask } from "@/types";
import { sortTasks } from "@/lib/utils";
import "@/styles/styles.css";

const History = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login page if not authenticated
  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load tasks from server when authenticated
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const fetchTasks = async () => {
        try {
          setError(null);
          const response = await fetch("/api/tasks");

          if (response.ok) {
            const data = await response.json();
            setTasks(data);
          } else if (response.status === 401) {
            router.push("/login");
          } else {
            const errorData = await response.json();
            setError(errorData.error || "Failed to load tasks");
          }
        } catch (error) {
          setError("Error connecting to the server");
          console.error("Error loading tasks:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchTasks();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, session, router]);

  // API function for deleting tasks
  const deleteTask = async (taskId: string) => {
    if (!window.confirm("Delete permanently?")) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTasks((prevTasks) =>
          prevTasks.filter((task) => task._id !== taskId)
        );
      } else if (response.status === 401) {
        router.push("/login");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete task");
      }
    } catch (error) {
      setError("Error connecting to the server");
      console.error("Error deleting task:", error);
    }
  };

  // API function for undoing tasks (mark as not done)
  const undoTask = async (taskId: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
      });

      if (response.ok) {
        const data = await response.json();
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task._id === data._id ? data : task))
        );
      } else if (response.status === 401) {
        router.push("/login");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to restore task");
      }
    } catch (error) {
      setError("Error connecting to the server");
      console.error("Error restoring task:", error);
    }
  };

  // API function for updating tasks (when edited in history)
  const updateTask = async (updatedTask: ITask) => {
    try {
      setError(null);
      const response = await fetch(`/api/tasks/${updatedTask._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTask),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks((prevTasks) =>
          sortTasks(
            prevTasks.map((task) => (task._id === data._id ? data : task))
          )
        );
      } else if (response.status === 401) {
        router.push("/login");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update task");
      }
    } catch (error) {
      setError("Error connecting to the server");
      console.error("Error updating task:", error);
    }
  };

  const printTasks = () => {
    window.print();
  };

  const headerButtons = [
    { label: "Back", onClick: () => router.push("/") },
    { label: "Print", onClick: printTasks },
  ];

  if (status === "loading") {
    return <div className="loading">Loading...</div>;
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (loading) {
    return <div className="loading">Loading history...</div>;
  }

  return (
    <div className="app-container">
      <Header
        title="Tasks "
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
          tasks={tasks.slice().reverse()}
          mode="history"
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
          onUndoTask={undoTask}
        />
      </div>
    </div>
  );
};

export default History;

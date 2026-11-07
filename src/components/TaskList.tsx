import React, { useState } from "react";
import TaskItem from "./TaskItem";
import InputRow from "./InputRow";
import { ITask, SearchState, TaskFormData } from "@/types";
import { addDivider, formatTimeDisplay } from "@/lib/utils";

interface TaskListProps {
  tasks: ITask[];
  mode: "main" | "history";
  loading?: boolean;
  onAddTask?: (task: TaskFormData) => void;
  onUpdateTask?: (task: ITask) => void;
  onDeleteTask?: (taskId: string) => void;
  onToggleTaskDone?: (taskId: string) => void;
  onUndoTask?: (taskId: string) => void;
}

export const TaskSkeleton = () => (
  <div className="task-item task-item-skeleton" aria-hidden="true">
    <div className="task-datetime-container">
      <div className="task-item-date">
        <div className="skeleton-bar" />
      </div>
      <div className="task-item-time">
        <div className="skeleton-bar" />
      </div>
    </div>
    <div className="task-item-text">
      <div className="skeleton-bar" />
    </div>
    <div className="task-item-actions" />
  </div>
);

const EMPTY_SEARCH: SearchState = { date: "", time: "", text: "" };

const matches = (value: string, term: string) =>
  !term || value.toLowerCase().includes(term.toLowerCase());

const TaskList = ({
  tasks,
  mode,
  loading = false,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTaskDone,
  onUndoTask,
}: TaskListProps) => {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [searchTerms, setSearchTerms] = useState<SearchState>(EMPTY_SEARCH);
  const isHistory = mode === "history";

  const handleSaveTask = (updatedTask: ITask) => {
    onUpdateTask?.(updatedTask);
    setEditingTaskId(null);
  };

  const handleSearchChange = (field: keyof SearchState, value: string) => {
    setSearchTerms((prev) => ({ ...prev, [field]: value }));
  };

  const filteredTasks = tasks.filter((task) => {
    if (task.isDone !== isHistory) return false;
    if (!isHistory) return true;
    return (
      matches(task.date, searchTerms.date) &&
      matches(formatTimeDisplay(task.time, task.date), searchTerms.time) &&
      matches(task.text, searchTerms.text)
    );
  });

  return (
    <div className="task-list">
      <InputRow
        mode={isHistory ? "search" : "add"}
        onAddTask={isHistory ? undefined : onAddTask}
        searchTerms={isHistory ? searchTerms : undefined}
        onSearchChange={isHistory ? handleSearchChange : undefined}
      />

      {loading && filteredTasks.length === 0 && (
        <>
          <TaskSkeleton />
          <TaskSkeleton />
          <TaskSkeleton />
          <TaskSkeleton />
        </>
      )}

      {filteredTasks.map((task, index) => {
        const id = task._id as string;
        return (
          <TaskItem
            key={id}
            task={task}
            index={index}
            mode={mode}
            isEditing={id === editingTaskId}
            onEdit={() => setEditingTaskId(id)}
            onSave={handleSaveTask}
            onCancelEdit={() => setEditingTaskId(null)}
            searchTerms={isHistory ? searchTerms : undefined}
            dividerType={addDivider(task, filteredTasks[index + 1] ?? null)}
            onToggleDone={isHistory ? undefined : () => onToggleTaskDone?.(id)}
            onUndo={isHistory ? () => onUndoTask?.(id) : undefined}
            onDelete={isHistory ? () => onDeleteTask?.(id) : undefined}
          />
        );
      })}
    </div>
  );
};

export default TaskList;

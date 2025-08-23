// src/components/TaskList.tsx
import React, { useState } from "react";
import TaskItem from "./TaskItem";
import InputRow from "./InputRow";
import { ITask, TaskFormData } from "@/types";
import { isLastTaskOfMonth } from "@/lib/utils";

interface SearchState {
  date: string;
  time: string;
  text: string;
}

interface TaskListProps {
  tasks: ITask[];
  mode: "main" | "history";

  // Main mode props
  onAddTask?: (task: TaskFormData) => void;
  onUpdateTask?: (task: ITask) => void;
  onDeleteTask?: (taskId: string) => void;
  onToggleTaskDone?: (taskId: string) => void;

  // History mode props
  onUndoTask?: (taskId: string) => void;
}

const TaskList = ({
  tasks,
  mode,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTaskDone,
  onUndoTask,
}: TaskListProps) => {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [searchTerms, setSearchTerms] = useState<SearchState>({
    date: "",
    time: "",
    text: "",
  });

  const handleEditTask = (taskId: string) => {
    setEditingTaskId(taskId);
  };

  const handleSaveTask = (updatedTask: ITask) => {
    onUpdateTask?.(updatedTask);
    setEditingTaskId(null);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
  };

  const handleSearchChange = (field: keyof SearchState, value: string) => {
    setSearchTerms((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Filter tasks based on mode
  const getFilteredTasks = () => {
    let filteredTasks = tasks;

    if (mode === "main") {
      // Main mode: show only active (not done) tasks
      filteredTasks = tasks.filter((task) => !task.isDone);
    } else if (mode === "history") {
      // History mode: show only completed tasks
      filteredTasks = tasks.filter((task) => task.isDone);

      // Apply search filters in history mode
      if (searchTerms.date || searchTerms.time || searchTerms.text) {
        filteredTasks = filteredTasks.filter((task) => {
          return (
            (!searchTerms.date ||
              task.date
                .toLowerCase()
                .includes(searchTerms.date.toLowerCase())) &&
            (!searchTerms.time ||
              task.time
                .toLowerCase()
                .includes(searchTerms.time.toLowerCase())) &&
            (!searchTerms.text ||
              task.text.toLowerCase().includes(searchTerms.text.toLowerCase()))
          );
        });
      }
    }

    return filteredTasks;
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="task-list">
      <InputRow
        mode={mode === "main" ? "add" : "search"}
        onAddTask={mode === "main" ? onAddTask : undefined}
        searchTerms={mode === "history" ? searchTerms : undefined}
        onSearchChange={mode === "history" ? handleSearchChange : undefined}
      />

      {filteredTasks.map((task, index) => {
        return (
          <TaskItem
            key={task._id}
            task={task}
            index={index}
            mode={mode}
            isEditing={task._id === editingTaskId}
            onEdit={() => handleEditTask(task._id as string)}
            onSave={handleSaveTask}
            onCancelEdit={handleCancelEdit}
            searchTerms={mode === "history" ? searchTerms : undefined}
            isLastOfMonth={isLastTaskOfMonth(
              task,
              index < filteredTasks.length - 1 ? filteredTasks[index + 1] : null
            )}
            onToggleDone={
              mode === "main"
                ? () => onToggleTaskDone?.(task._id as string)
                : undefined
            }
            onUndo={
              mode === "history"
                ? () => onUndoTask?.(task._id as string)
                : undefined
            }
            onDelete={
              mode === "history"
                ? () => onDeleteTask?.(task._id as string)
                : undefined
            }
          />
        );
      })}
    </div>
  );
};

export default TaskList;

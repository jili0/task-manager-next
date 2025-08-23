// src/components/TaskItem.tsx
import React from "react";
import { ITask } from "@/types";
import { formatTimeDisplay } from "@/lib/utils";
import InputRow from "./InputRow";

interface SearchState {
  date: string;
  time: string;
  text: string;
}

interface TaskItemProps {
  task: ITask;
  index: number;
  mode: "main" | "history";
  isLastOfMonth?: boolean;

  // Edit functionality (for both modes)
  isEditing?: boolean;
  onEdit?: () => void;
  onSave?: (task: ITask) => void;
  onCancelEdit?: () => void;

  // Search highlighting (history mode only)
  searchTerms?: SearchState;

  // Action buttons (mode-specific)
  onToggleDone?: () => void; // main mode
  onUndo?: () => void; // history mode
  onDelete?: () => void; // history mode
}

const TaskItem = ({
  task,
  index,
  mode,
  isLastOfMonth = false,
  isEditing = false,
  onEdit,
  onSave,
  onCancelEdit,
  searchTerms,
  onToggleDone,
  onUndo,
  onDelete,
}: TaskItemProps) => {
  // Function to highlight search terms (history mode)
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm || !text || mode !== "history") return text;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
  };

  // Render edit mode using InputRow
  if (isEditing) {
    return (
      <InputRow
        mode="edit"
        editTask={task}
        onSaveEdit={onSave}
        onCancelEdit={onCancelEdit}
      />
    );
  }

  // Render display mode
  return (
    <div
      className={`task-item ${index % 2 === 0 ? "" : "even"} ${
        isLastOfMonth ? "last-of-month" : ""
      }`}
    >
      <div className="task-datetime-container">
        <div className="task-item-date">
          {mode === "history" && searchTerms
            ? highlightText(task.date || "", searchTerms.date)
            : task.date || " "}
        </div>
        <div className="task-item-time">
          {mode === "history" && searchTerms
            ? highlightText(
                formatTimeDisplay(task.time || "", task.date),
                searchTerms.time
              )
            : formatTimeDisplay(task.time || "", task.date) || " "}
        </div>
      </div>
      <div className="task-item-text">
        {task.text
          ? task.text.split("\n").map((line, i) => (
              <React.Fragment key={i}>
                {mode === "history" && searchTerms
                  ? highlightText(line, searchTerms.text)
                  : line}
                {i < task.text.split("\n").length - 1 && <br />}
              </React.Fragment>
            ))
          : " "}
      </div>
      <div className="task-item-actions">
        {mode === "main" && onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="btn btn-primary"
            title="Edit task"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        )}

        {mode === "main" && onToggleDone && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleDone();
            }}
            className="btn btn-danger"
            title="Mark as done"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        )}

        {mode === "history" && onUndo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUndo();
            }}
            className="btn btn-secondary"
            title="Restore task"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 4v6h6"></path>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
          </button>
        )}

        {mode === "history" && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="btn btn-danger"
            title="Delete permanently"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskItem;

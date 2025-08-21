// src/components/TaskItem.tsx
import React, { useState, useEffect, useRef } from "react";
import { ITask } from "@/types";
import { formatDate, formatTime } from "@/lib/utils";

interface SearchState {
  date: string;
  time: string;
  text: string;
}

interface TaskItemProps {
  task: ITask;
  index: number;
  mode: "main" | "history";

  // Edit functionality (for both modes)
  isEditing?: boolean;
  onEdit?: () => void;
  onSave?: (task: ITask) => void;

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
  isEditing = false,
  onEdit,
  onSave,
  searchTerms,
  onToggleDone,
  onUndo,
  onDelete,
}: TaskItemProps) => {
  const [editedTask, setEditedTask] = useState<ITask>({
    ...task,
    date: task.date || "",
    time: task.time || "",
    text: task.text || "",
  });

  const timeInputRef = useRef<HTMLTextAreaElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditedTask({
      ...task,
      date: task.date || "",
      time: task.time || "",
      text: task.text || "",
    });
  }, [task]);

  // Auto-resize textarea
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height =
        textAreaRef.current.scrollHeight + "px";
    }
  }, [editedTask.text]);

  // Function to highlight search terms (history mode)
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm || !text || mode !== "history") return text;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Special handling for date formatting
    if (name === "date") {
      if (value.match(/^\d{1,5}$/)) {
        setEditedTask((prev) => ({
          ...prev,
          date: value,
        }));
        return;
      } else if (value.match(/^\d{6}$/)) {
        const formattedDate = formatDate(value);
        onSave?.({
          ...task,
          ...editedTask,
          date: formattedDate,
        });
        return;
      }
    }

    // Special handling for time formatting
    if (name === "time") {
      if (value.match(/^\d{1,3}$/)) {
        setEditedTask((prev) => ({
          ...prev,
          time: value,
        }));
        return;
      }

      if (value.match(/^\d{4}$/)) {
        const formattedTime = formatTime(value);
        setEditedTask((prev) => ({
          ...prev,
          time: formattedTime,
        }));
        return;
      }
    }

    setEditedTask((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.currentTarget.name === "date") {
        e.preventDefault();

        if (
          editedTask.date &&
          (editedTask.date.match(/^\d{2}$/) || editedTask.date.match(/^\d{4}$/))
        ) {
          const formattedDate = formatDate(editedTask.date);
          setEditedTask((prev) => ({
            ...prev,
            date: formattedDate,
          }));
        }

        timeInputRef.current?.focus();
        return;
      }

      if (e.currentTarget.name === "time") {
        e.preventDefault();

        if (editedTask.time && editedTask.time.match(/^\d{2}$/)) {
          const formattedTime = `${editedTask.time}:00`;
          setEditedTask((prev) => ({
            ...prev,
            time: formattedTime,
          }));
        }

        textAreaRef.current?.focus();
        return;
      }

      if (e.currentTarget.name === "text") {
        return; // Allow normal Enter for new lines
      }
    }

    if (e.key === "Escape") {
      saveTask();
    }
  };

  const saveTask = () => {
    if (editedTask.date || editedTask.time || editedTask.text) {
      onSave?.({
        ...task,
        ...editedTask,
      });
    }
  };

  const handleItemClick = () => {
    if (mode === "main" || mode === "history") {
      onEdit?.();
    }
  };

  // Render edit mode
  if (isEditing) {
    return (
      <div
        className={`task-item task-item-input ${index % 2 === 0 ? "" : "even"}`}
      >
        <div className="task-datetime-container">
          <div className="task-item-date">
            <textarea
              name="date"
              value={editedTask.date}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Date"
              autoFocus
            />
          </div>
          <div className="task-item-time">
            <textarea
              name="time"
              value={editedTask.time}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Time"
              ref={timeInputRef}
            />
          </div>
        </div>
        <div className="task-item-text">
          <textarea
            name="text"
            value={editedTask.text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Task"
            ref={textAreaRef}
          />
        </div>
        <div className="task-item-actions">
          <button
            onClick={saveTask}
            className="btn btn-small btn-success"
            title="Save"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path>
              <polyline points="17,21 17,13 7,13 7,21"></polyline>
              <polyline points="7,3 7,8 15,8"></polyline>
            </svg>
          </button>
          <button
            onClick={() => onSave?.(task)}
            className="btn btn-small btn-primary"
            title="Cancel"
          >
            <svg
              width="14"
              height="14"
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
        </div>
      </div>
    );
  }

  // Render display mode
  return (
    <div className={`task-item ${index % 2 === 0 ? "" : "even"}`}>
      <div className="task-datetime-container">
        <div className="task-item-date">
          {mode === "history" && searchTerms
            ? highlightText(task.date || "", searchTerms.date)
            : task.date || " "}
        </div>
        <div className="task-item-time">
          {mode === "history" && searchTerms
            ? highlightText(task.time || "", searchTerms.time)
            : task.time || " "}
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
            className="btn btn-small btn-primary"
            title="Edit task"
          >
            <svg
              width="14"
              height="14"
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
            className="btn btn-small btn-danger"
            title="Mark as done"
          >
            <svg
              width="14"
              height="14"
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
            className="btn btn-small btn-secondary"
            title="Restore task"
          >
            <svg
              width="14"
              height="14"
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
            className="btn btn-small btn-danger"
            title="Delete permanently"
          >
            <svg
              width="14"
              height="14"
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

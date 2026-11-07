import React, { useState } from "react";
import { ITask, SearchState } from "@/types";
import {
  escapeRegExp,
  formatTimeDisplay,
  isValidDateString,
} from "@/lib/utils";
import InputRow from "./InputRow";
import { EditIcon, TrashIcon, UndoIcon } from "./Icons";

interface TaskItemProps {
  task: ITask;
  index: number;
  mode: "main" | "history";
  dividerType?: "month" | "year" | null;
  isEditing?: boolean;
  onEdit?: () => void;
  onSave?: (task: ITask) => void;
  onCancelEdit?: () => void;
  searchTerms?: SearchState;
  onToggleDone?: () => void;
  onUndo?: () => void;
  onDelete?: () => void;
}

const highlight = (text: string, term: string): React.ReactNode => {
  if (!term || !text) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, "gi"));
  return parts.map((part, i) =>
    i % 2 === 1 ? <mark key={i}>{part}</mark> : part
  );
};

const trimBlankLines = (text: string): string[] => {
  const lines = text.split("\n");
  let from = 0;
  let to = lines.length;
  while (from < to && lines[from] === "") from++;
  while (to > from && lines[to - 1] === "") to--;
  return lines.slice(from, to);
};

const ActionButton = ({
  onClick,
  className,
  title,
  children,
}: {
  onClick: () => void;
  className: string;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`btn ${className}`}
    title={title}
    aria-label={title}
  >
    {children}
  </button>
);

const TaskItem = ({
  task,
  index,
  mode,
  dividerType = null,
  isEditing = false,
  onEdit,
  onSave,
  onCancelEdit,
  searchTerms,
  onToggleDone,
  onUndo,
  onDelete,
}: TaskItemProps) => {
  const [copiedLineIndex, setCopiedLineIndex] = useState<number | null>(null);

  const copyLine = async (lineText: string, lineIndex: number) => {
    try {
      await navigator.clipboard.writeText(lineText);
      setCopiedLineIndex(lineIndex);
      setTimeout(() => {
        setCopiedLineIndex((current) =>
          current === lineIndex ? null : current
        );
      }, 300);
    } catch {}
  };

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

  const terms = mode === "history" ? searchTerms : undefined;
  const dateInvalid = !!task.date && !isValidDateString(task.date);
  const timeDisplay = formatTimeDisplay(task.time, task.date);
  const classes = [
    "task-item",
    index % 2 === 1 ? "even" : "",
    dividerType === "month" ? "last-of-month" : "",
    dividerType === "year" ? "last-of-year" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <div className="task-datetime-container">
        <div
          className={
            "task-item-date" + (dateInvalid ? " task-item-date-invalid" : "")
          }
          title={dateInvalid ? "Invalid date, please edit" : undefined}
        >
          {task.birthdayId && (
            <span className="recurring-marker" title="Birthday">
              🎂
            </span>
          )}
          {terms ? highlight(task.date, terms.date) : task.date || " "}
        </div>
        <div className="task-item-time">
          {terms ? highlight(timeDisplay, terms.time) : timeDisplay || " "}
        </div>
      </div>
      <div className="task-item-text">
        {task.text
          ? trimBlankLines(task.text).map((line, i) => (
              <span
                key={i}
                onDoubleClick={() => copyLine(line, i)}
                className={copiedLineIndex === i ? "copied" : undefined}
                style={{ cursor: "pointer" }}
                title="Double click to copy this line"
              >
                {terms ? highlight(line, terms.text) : line}
              </span>
            ))
          : " "}
      </div>
      <div className="task-item-actions">
        {mode === "main" && onEdit && (
          <ActionButton onClick={onEdit} className="btn-primary" title="Edit">
            <EditIcon />
          </ActionButton>
        )}
        {mode === "main" && onToggleDone && (
          <ActionButton
            onClick={onToggleDone}
            className="btn-danger"
            title="Mark as done"
          >
            <TrashIcon />
          </ActionButton>
        )}
        {mode === "history" && onUndo && (
          <ActionButton
            onClick={onUndo}
            className="btn-secondary"
            title="Restore"
          >
            <UndoIcon />
          </ActionButton>
        )}
        {mode === "history" && onDelete && (
          <ActionButton
            onClick={onDelete}
            className="btn-danger"
            title="Delete permanently"
          >
            <TrashIcon />
          </ActionButton>
        )}
      </div>
    </div>
  );
};

export default TaskItem;

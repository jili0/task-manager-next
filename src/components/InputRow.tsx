// src/components/InputRow.tsx
import React, { useState, useRef, useEffect } from "react";
import { TaskFormData } from "@/types";
import { formatDate, formatTime } from "@/lib/utils";

interface SearchState {
  date: string;
  time: string;
  text: string;
}

interface InputRowProps {
  mode: "add" | "search";
  // Add mode props
  onAddTask?: (task: TaskFormData) => void;
  // Search mode props
  searchTerms?: SearchState;
  onSearchChange?: (field: keyof SearchState, value: string) => void;
}

const InputRow = ({
  mode,
  onAddTask,
  searchTerms,
  onSearchChange,
}: InputRowProps) => {
  // Add mode state
  const [newTask, setNewTask] = useState<TaskFormData>({
    date: "",
    time: "",
    text: "",
  });

  const timeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Helper functions for add mode
  const getCurrentDate = (): string => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, "0");
    const month = (today.getMonth() + 1).toString().padStart(2, "0");
    const year = today.getFullYear();
    const days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
    const weekday = days[today.getDay()];

    return `${weekday}, ${day}.${month}.${year}`;
  };

  const getCurrentTime = (): string => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");

    return `${hours}:${minutes}`;
  };

  // Auto-resize textarea function
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  };

  // Adjust height when text changes (add mode only)
  useEffect(() => {
    if (mode === "add" && textAreaRef.current) {
      adjustTextareaHeight(textAreaRef.current);
    }
  }, [mode === "add" ? newTask.text : ""]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (mode === "add") {
      // Auto-resize on change
      adjustTextareaHeight(e.target);

      // Special handling for date formatting
      if (name === "date") {
        if (value.match(/^\d{1,5}$/)) {
          setNewTask((prev) => ({ ...prev, date: value }));
          return;
        } else if (value.match(/^\d{6}$/)) {
          const formattedDate = formatDate(value);
          setNewTask((prev) => ({ ...prev, date: formattedDate }));
          timeTextareaRef.current?.focus();
          return;
        }
      }

      // Special handling for time formatting
      if (name === "time") {
        if (value.match(/^\d{1,3}$/)) {
          setNewTask((prev) => ({ ...prev, time: value }));
          return;
        } else if (value.match(/^\d{4}$/)) {
          const formattedTime = formatTime(value);
          setNewTask((prev) => ({ ...prev, time: formattedTime }));
          return;
        }
      }

      setNewTask((prev) => ({ ...prev, [name]: value }));
    } else if (mode === "search") {
      // Search mode
      onSearchChange?.(name as keyof SearchState, value);
    }
  };

  const updateDateFormat = () => {
    if (
      newTask.date &&
      (newTask.date.match(/^\d{2}$/) || newTask.date.match(/^\d{4}$/))
    ) {
      const formattedDate = formatDate(newTask.date);
      setNewTask((prev) => ({ ...prev, date: formattedDate }));
    }
  };

  const updateTimeFormat = () => {
    if (newTask.time && newTask.time.match(/^\d{2}$/)) {
      setNewTask((prev) => ({ ...prev, time: `${newTask.time}:00` }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (mode === "add") {
      if (e.target.name === "date") {
        updateDateFormat();
      } else if (e.target.name === "time") {
        updateTimeFormat();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mode !== "add") return;

    if (e.key === "Enter") {
      if (e.currentTarget.name === "date") {
        e.preventDefault();
        if (!newTask.date.trim()) {
          setNewTask((prev) => ({ ...prev, date: getCurrentDate() }));
        } else {
          updateDateFormat();
        }
        timeTextareaRef.current?.focus();
        return;
      }

      if (e.currentTarget.name === "time") {
        e.preventDefault();
        if (!newTask.time.trim()) {
          setNewTask((prev) => ({ ...prev, time: getCurrentTime() }));
        } else {
          updateTimeFormat();
        }
        textAreaRef.current?.focus();
        return;
      }

      if (e.currentTarget.name === "text") {
        if (e.metaKey) {
          e.preventDefault();
          const textarea = e.currentTarget;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const value = textarea.value;
          const newValue =
            value.substring(0, start) + "\n" + value.substring(end);

          setNewTask((prev) => ({ ...prev, text: newValue }));
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 1;
          }, 0);
        } else {
          e.preventDefault();
          handleAddTask();
        }
      }
    }
  };

  const handleAddTask = () => {
    if (mode !== "add") return;

    if (newTask.date || newTask.time || newTask.text) {
      const taskToAdd = {
        date: newTask.date.trim() || getCurrentDate(),
        time: newTask.time.trim() || getCurrentTime(),
        text: newTask.text,
      };

      onAddTask?.(taskToAdd);
      setNewTask({ date: "", time: "", text: "" });
    }
  };

  // Get values based on mode
  const getValues = () => {
    if (mode === "add") {
      return newTask;
    } else {
      return searchTerms || { date: "", time: "", text: "" };
    }
  };

  // Get placeholders based on mode
  const getPlaceholders = () => {
    if (mode === "add") {
      return { date: "Add Date", time: "Add Time", text: "Add Task" };
    } else {
      return { date: "Search Date", time: "Search Time", text: "Search Task" };
    }
  };

  const values = getValues();
  const placeholders = getPlaceholders();

  return (
    <div className="task-item task-item-input">
      <div className="task-datetime-container">
        <div className="task-item-date">
          <textarea
            name="date"
            value={values.date}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholders.date}
          />
        </div>
        <div className="task-item-time">
          <textarea
            name="time"
            value={values.time}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholders.time}
            ref={timeTextareaRef}
          />
        </div>
      </div>
      <div className="task-item-text">
        <textarea
          name="text"
          value={values.text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholders.text}
          ref={textAreaRef}
        />
      </div>
      <div className="task-item-actions">
        {mode === "add" && (
          <button
            onClick={handleAddTask}
            className="btn btn-primary"
            title="Add Task"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        )}
        {mode !== "add" && (
          <button
            onClick={handleAddTask}
            className="btn btn-primary"
            title="Search"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default InputRow;

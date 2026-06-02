// src/components/InputRow.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { TaskFormData, ITask } from "@/types";
import {
  formatDate,
  formatTime,
  isValidDateString,
  isValidTimeString,
  debounce,
} from "@/lib/utils";

interface SearchState {
  date: string;
  time: string;
  text: string;
}

interface InputRowProps {
  mode: "add" | "search" | "edit";

  // Add mode props
  onAddTask?: (task: TaskFormData) => void;

  // Search mode props
  searchTerms?: SearchState;
  onSearchChange?: (field: keyof SearchState, value: string) => void;

  // Edit mode props
  editTask?: ITask;
  onSaveEdit?: (task: ITask) => void;
  onCancelEdit?: () => void;

  // Draft mode props
  draftMode?: "add" | "edit";
  draftTaskId?: string;
}

const InputRow = ({
  mode,
  onAddTask,
  searchTerms,
  onSearchChange,
  editTask,
  onSaveEdit,
  onCancelEdit,
  draftMode,
  draftTaskId,
}: InputRowProps) => {
  // Add mode state
  const [newTask, setNewTask] = useState<TaskFormData>({
    date: "",
    time: "",
    text: "",
  });

  // Edit mode state
  const [editedTask, setEditedTask] = useState<ITask>({
    _id: "",
    date: "",
    time: "",
    text: "",
    isDone: false,
  });

  const [isDraftLoaded, setIsDraftLoaded] = useState<boolean>(false);
  const [userTouched, setUserTouched] = useState<boolean>(false);

  // Visual feedback when a date/time value cannot be parsed as a real date/time
  const [dateInvalid, setDateInvalid] = useState<boolean>(false);
  const [timeInvalid, setTimeInvalid] = useState<boolean>(false);

  const saveDraft = useCallback(async (draftData: any) => {
    try {
      await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftData),
      });
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  }, []);

  // Stable debounced ref — never recreated, so the 500ms timer persists across renders
  const debouncedSaveDraftRef = useRef(debounce(saveDraft, 500));

  const timeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize edit mode with task data
  useEffect(() => {
    if (mode === "edit" && editTask) {
      setEditedTask({
        ...editTask,
        date: editTask.date || "",
        time: editTask.time || "",
        text: editTask.text || "",
      });
    }
  }, [mode, editTask]);

  // Load draft on mount
  useEffect(() => {
    if ((mode === "add" || mode === "edit") && !isDraftLoaded) {
      loadDraft();
    }
  }, [mode, draftMode, draftTaskId, isDraftLoaded]);

  const loadDraft = async () => {
    try {
      const params = new URLSearchParams();
      params.set("mode", draftMode || mode);
      if (draftMode === "edit" && draftTaskId) {
        params.set("taskId", draftTaskId);
      }

      const response = await fetch(`/api/drafts?${params}`);
      if (response.ok) {
        const draft = await response.json();
        if (draft) {
          if (mode === "add") {
            setNewTask({
              date: draft.date,
              time: draft.time,
              text: draft.text,
            });
          } else if (mode === "edit") {
            setEditedTask((prev) => ({
              ...prev,
              date: draft.date,
              time: draft.time,
              text: draft.text,
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error loading draft:", error);
    } finally {
      setIsDraftLoaded(true);
    }
  };

  // Auto-save draft only after the user has actually typed something
  useEffect(() => {
    if (!isDraftLoaded || !userTouched) return;

    if (mode === "add") {
      const draftData = {
        mode: "add",
        date: newTask.date,
        time: newTask.time,
        text: newTask.text,
      };
      debouncedSaveDraftRef.current(draftData);
    }
  }, [newTask, isDraftLoaded, mode, userTouched]);

  useEffect(() => {
    if (!isDraftLoaded || !userTouched) return;

    if (mode === "edit" && draftTaskId) {
      const draftData = {
        mode: "edit",
        taskId: draftTaskId,
        date: editedTask.date,
        time: editedTask.time,
        text: editedTask.text,
      };
      debouncedSaveDraftRef.current(draftData);
    }
  }, [editedTask, isDraftLoaded, mode, draftTaskId, userTouched]);

  // Helper functions for add mode
  const getCurrentDate = (): string => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, "0");
    const month = (today.getMonth() + 1).toString().padStart(2, "0");
    const year = today.getFullYear();

    return `${day}.${month}.${year}`;
  };

  const getCurrentTime = (): string => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");

    return `${hours}:${minutes}`;
  };

  // Auto-resize textarea function - only for text field
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + 16 + "px";
  };

  // Adjust height when text changes - only for text field
  useEffect(() => {
    if (textAreaRef.current) {
      adjustTextareaHeight(textAreaRef.current);
    }
  }, [
    mode === "add"
      ? newTask.text
      : mode === "edit"
        ? editedTask.text
        : searchTerms?.text || "",
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name } = e.target;
    let { value } = e.target;

    // Normalize separators so users can type ":" or "/" or "-" interchangeably
    if ((mode === "add" || mode === "edit") && name === "date") {
      value = value.replace(/[:/\-]/g, ".");
    } else if ((mode === "add" || mode === "edit") && name === "time") {
      value = value.replace(/[./\-]/g, ":");
    }

    // Clear invalid state as soon as the user starts editing
    if (name === "date") setDateInvalid(false);
    else if (name === "time") setTimeInvalid(false);

    if (mode === "add" || mode === "edit") {
      setUserTouched(true);
    }

    if (mode === "add") {
      // Date — auto-format on 6 raw digits
      if (name === "date") {
        if (/^\d{6}$/.test(value)) {
          const formatted = formatDate(value);
          setNewTask((prev) => ({ ...prev, date: formatted }));
          if (isValidDateString(formatted)) {
            timeTextareaRef.current?.focus();
          } else {
            setDateInvalid(true);
          }
          return;
        }
        setNewTask((prev) => ({ ...prev, date: value }));
        return;
      }

      // Time — auto-format on 4 raw digits, then jump to text on success
      if (name === "time") {
        if (/^\d{4}$/.test(value)) {
          const formatted = formatTime(value);
          setNewTask((prev) => ({ ...prev, time: formatted }));
          if (isValidTimeString(formatted)) {
            textAreaRef.current?.focus();
          } else {
            setTimeInvalid(true);
          }
          return;
        }
        setNewTask((prev) => ({ ...prev, time: value }));
        return;
      }

      if (name === "text") {
        adjustTextareaHeight(e.target);
      }

      setNewTask((prev) => ({ ...prev, [name]: value }));
    } else if (mode === "edit") {
      if (name === "date") {
        if (/^\d{6}$/.test(value)) {
          const formatted = formatDate(value);
          setEditedTask((prev) => ({ ...prev, date: formatted }));
          if (isValidDateString(formatted)) {
            timeTextareaRef.current?.focus();
          } else {
            setDateInvalid(true);
          }
          return;
        }
        setEditedTask((prev) => ({ ...prev, date: value }));
        return;
      }

      if (name === "time") {
        if (/^\d{4}$/.test(value)) {
          const formatted = formatTime(value);
          setEditedTask((prev) => ({ ...prev, time: formatted }));
          if (isValidTimeString(formatted)) {
            textAreaRef.current?.focus();
          } else {
            setTimeInvalid(true);
          }
          return;
        }
        setEditedTask((prev) => ({ ...prev, time: value }));
        return;
      }

      if (name === "text") {
        adjustTextareaHeight(e.target);
      }

      setEditedTask((prev) => ({ ...prev, [name]: value }));
    } else if (mode === "search") {
      if (name === "text") {
        adjustTextareaHeight(e.target);
      }
      onSearchChange?.(name as keyof SearchState, value);
    }
  };

  const updateDateFormat = () => {
    if (mode === "add") {
      if (!newTask.date) {
        setDateInvalid(false);
        return;
      }
      const formatted = formatDate(newTask.date);
      setNewTask((prev) => ({ ...prev, date: formatted }));
      setDateInvalid(!isValidDateString(formatted));
    } else if (mode === "edit") {
      if (!editedTask.date) {
        setDateInvalid(false);
        return;
      }
      const formatted = formatDate(editedTask.date);
      setEditedTask((prev) => ({ ...prev, date: formatted }));
      setDateInvalid(!isValidDateString(formatted));
    }
  };

  const updateTimeFormat = () => {
    if (mode === "add") {
      if (!newTask.time) {
        setTimeInvalid(false);
        return;
      }
      const formatted = formatTime(newTask.time);
      setNewTask((prev) => ({ ...prev, time: formatted }));
      setTimeInvalid(!isValidTimeString(formatted));
    } else if (mode === "edit") {
      if (!editedTask.time) {
        setTimeInvalid(false);
        return;
      }
      const formatted = formatTime(editedTask.time);
      setEditedTask((prev) => ({ ...prev, time: formatted }));
      setTimeInvalid(!isValidTimeString(formatted));
    }
  };

  // Read the DOM value directly instead of going through state. When the
  // 6-digit auto-format in handleChange focuses the time field, blur fires
  // synchronously before React commits — so the closure's newTask.date is
  // still the pre-keystroke value and would re-format into garbage.
  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (mode !== "add" && mode !== "edit") return;
    const { name, value } = e.target;
    if (name !== "date" && name !== "time") return;

    if (!value) {
      if (name === "date") setDateInvalid(false);
      else setTimeInvalid(false);
      return;
    }

    const formatted =
      name === "date" ? formatDate(value) : formatTime(value);
    const valid =
      name === "date"
        ? isValidDateString(formatted)
        : isValidTimeString(formatted);

    if (mode === "add") {
      setNewTask((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setEditedTask((prev) => ({ ...prev, [name]: formatted }));
    }
    if (name === "date") setDateInvalid(!valid);
    else setTimeInvalid(!valid);
  };

  // When a field is marked invalid, clicking back into it clears the bad value
  // so the user can re-enter without manually deleting first.
  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (mode !== "add" && mode !== "edit") return;
    const { name } = e.target;
    if (name === "date" && dateInvalid) {
      if (mode === "add") {
        setNewTask((prev) => ({ ...prev, date: "" }));
      } else {
        setEditedTask((prev) => ({ ...prev, date: "" }));
      }
      setDateInvalid(false);
    } else if (name === "time" && timeInvalid) {
      if (mode === "add") {
        setNewTask((prev) => ({ ...prev, time: "" }));
      } else {
        setEditedTask((prev) => ({ ...prev, time: "" }));
      }
      setTimeInvalid(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mode !== "add" && mode !== "edit") return;

    if (e.key === "Enter") {
      if (e.currentTarget.name === "date") {
        e.preventDefault();
        if (mode === "add") {
          if (!newTask.date.trim()) {
            setNewTask((prev) => ({ ...prev, date: getCurrentDate() }));
            setDateInvalid(false);
          } else {
            updateDateFormat();
          }
        } else if (mode === "edit") {
          updateDateFormat();
        }
        timeTextareaRef.current?.focus();
        return;
      }

      if (e.currentTarget.name === "time") {
        e.preventDefault();
        if (mode === "add") {
          if (!newTask.time.trim()) {
            setNewTask((prev) => ({ ...prev, time: getCurrentTime() }));
            setTimeInvalid(false);
          } else {
            updateTimeFormat();
          }
        } else if (mode === "edit") {
          updateTimeFormat();
        }
        textAreaRef.current?.focus();
        return;
      }

      if (e.currentTarget.name === "text") {
        if (e.metaKey || e.shiftKey || e.altKey || e.ctrlKey) {
          e.preventDefault();
          const textarea = e.currentTarget;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const value = textarea.value;
          const newValue =
            value.substring(0, start) + "\n" + value.substring(end);

          if (mode === "add") {
            setNewTask((prev) => ({ ...prev, text: newValue }));
          } else if (mode === "edit") {
            setEditedTask((prev) => ({ ...prev, text: newValue }));
          }

          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 1;
          }, 0);
        } else {
          e.preventDefault();
          if (mode === "add") {
            handleAddTask();
          } else if (mode === "edit") {
            handleSaveEdit();
          }
        }
      }
    }

    if (e.key === "Escape" && mode === "edit") {
      onCancelEdit?.();
    }
  };

  const deleteDraft = async () => {
    try {
      const params = new URLSearchParams();
      params.set("mode", draftMode || mode);
      if (draftMode === "edit" && draftTaskId) {
        params.set("taskId", draftTaskId);
      }

      await fetch(`/api/drafts?${params}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting draft:", error);
    }
  };

  const handleAddTask = () => {
    if (mode !== "add") return;
    if (!(newTask.date || newTask.time || newTask.text)) return;

    const formattedDate = newTask.date.trim() ? formatDate(newTask.date) : "";
    const formattedTime = newTask.time.trim() ? formatTime(newTask.time) : "";

    if (formattedDate && !isValidDateString(formattedDate)) {
      setNewTask((prev) => ({ ...prev, date: formattedDate }));
      setDateInvalid(true);
      return;
    }
    if (formattedTime && !isValidTimeString(formattedTime)) {
      setNewTask((prev) => ({ ...prev, time: formattedTime }));
      setTimeInvalid(true);
      return;
    }

    const taskToAdd = {
      date: formattedDate || getCurrentDate(),
      time: formattedTime || getCurrentTime(),
      text: newTask.text,
    };

    onAddTask?.(taskToAdd);
    setNewTask({ date: "", time: "", text: "" });
    setDateInvalid(false);
    setTimeInvalid(false);
    setUserTouched(false);
    debouncedSaveDraftRef.current.cancel();
    deleteDraft();
  };

  const handleSaveEdit = () => {
    if (mode !== "edit") return;
    if (!(editedTask.date || editedTask.time || editedTask.text)) return;

    const formattedDate = editedTask.date.trim()
      ? formatDate(editedTask.date)
      : "";
    const formattedTime = editedTask.time.trim()
      ? formatTime(editedTask.time)
      : "";

    if (formattedDate && !isValidDateString(formattedDate)) {
      setEditedTask((prev) => ({ ...prev, date: formattedDate }));
      setDateInvalid(true);
      return;
    }
    if (formattedTime && !isValidTimeString(formattedTime)) {
      setEditedTask((prev) => ({ ...prev, time: formattedTime }));
      setTimeInvalid(true);
      return;
    }

    onSaveEdit?.({
      ...editedTask,
      date: formattedDate,
      time: formattedTime,
    });
    setUserTouched(false);
    debouncedSaveDraftRef.current.cancel();
    deleteDraft();
  };

  const handleCancelEdit = () => {
    if (mode !== "edit") return;
    onCancelEdit?.();
  };

  // Get values based on mode
  const getValues = () => {
    if (mode === "add") {
      return newTask;
    } else if (mode === "edit") {
      return editedTask;
    } else {
      return searchTerms || { date: "", time: "", text: "" };
    }
  };

  // Get placeholders based on mode
  const getPlaceholders = () => {
    if (mode === "add") {
      return { date: "Date", time: "Time", text: "Write New Task" };
    } else if (mode === "edit") {
      return { date: "Date", time: "Time", text: "Task" };
    } else {
      return { date: "Date", time: "Time", text: "Search Tasks" };
    }
  };

  const values = getValues();
  const placeholders = getPlaceholders();
  const showInvalid = mode === "add" || mode === "edit";

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
            onFocus={handleFocus}
            placeholder={placeholders.date}
            autoFocus={mode === "edit"}
            inputMode={mode !== "search" ? "numeric" : undefined}
            className={showInvalid && dateInvalid ? "invalid" : undefined}
            aria-invalid={showInvalid && dateInvalid ? true : undefined}
            title={
              showInvalid && dateInvalid
                ? "Please enter a valid date (DD.MM.YYYY)"
                : undefined
            }
            rows={1}
          />
        </div>
        <div className="task-item-time">
          <textarea
            name="time"
            value={values.time}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={placeholders.time}
            ref={timeTextareaRef}
            inputMode={mode !== "search" ? "numeric" : undefined}
            className={showInvalid && timeInvalid ? "invalid" : undefined}
            aria-invalid={showInvalid && timeInvalid ? true : undefined}
            title={
              showInvalid && timeInvalid
                ? "Please enter a valid time (HH:MM)"
                : undefined
            }
            rows={1}
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
          rows={2}
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
              width="18"
              height="18"
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

        {mode === "search" && (
          <button className="btn btn-primary" title="Search">
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
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
        )}

        {mode === "edit" && (
          <>
            <button
              onClick={handleCancelEdit}
              className="btn btn-primary"
              title="Cancel"
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
            <button
              onClick={handleSaveEdit}
              className="btn btn-success"
              title="Save"
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
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path>
                <polyline points="17,21 17,13 7,13 7,21"></polyline>
                <polyline points="7,3 7,8 15,8"></polyline>
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default InputRow;

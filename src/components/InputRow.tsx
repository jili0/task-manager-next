// src/components/InputRow.tsx
import React, { useState, useRef, useEffect } from "react";
import { TaskFormData, ITask, IDraft } from "@/types";
import { formatDate, formatTime, debounce } from "@/lib/utils";

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

  // Debounced auto-save function
  const debouncedSaveDraft = debounce(async (draftData: any) => {
    try {
      await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftData),
      });
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  }, 500);

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

  // Auto-save draft when values change
  useEffect(() => {
    if (!isDraftLoaded) return;

    if (mode === "add") {
      const draftData = {
        mode: "add",
        date: newTask.date,
        time: newTask.time,
        text: newTask.text,
      };
      debouncedSaveDraft(draftData);
    }
  }, [newTask, isDraftLoaded, mode, debouncedSaveDraft]);

  useEffect(() => {
    if (!isDraftLoaded) return;

    if (mode === "edit" && draftTaskId) {
      const draftData = {
        mode: "edit",
        taskId: draftTaskId,
        date: editedTask.date,
        time: editedTask.time,
        text: editedTask.text,
      };
      debouncedSaveDraft(draftData);
    }
  }, [editedTask, isDraftLoaded, mode, draftTaskId, debouncedSaveDraft]);

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
  }, [mode === "add" ? newTask.text : mode === "edit" ? editedTask.text : ""]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (mode === "add") {
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

      // Auto-resize for text field only
      if (name === "text") {
        adjustTextareaHeight(e.target);
      }

      setNewTask((prev) => ({ ...prev, [name]: value }));
    } else if (mode === "edit") {
      // Special handling for date formatting in edit mode
      if (name === "date") {
        if (value.match(/^\d{1,5}$/)) {
          setEditedTask((prev) => ({ ...prev, date: value }));
          return;
        } else if (value.match(/^\d{6}$/)) {
          const formattedDate = formatDate(value);
          setEditedTask((prev) => ({ ...prev, date: formattedDate }));
          timeTextareaRef.current?.focus();
          return;
        }
      }

      // Special handling for time formatting in edit mode
      if (name === "time") {
        if (value.match(/^\d{1,3}$/)) {
          setEditedTask((prev) => ({ ...prev, time: value }));
          return;
        } else if (value.match(/^\d{4}$/)) {
          const formattedTime = formatTime(value);
          setEditedTask((prev) => ({ ...prev, time: formattedTime }));
          return;
        }
      }

      // Auto-resize for text field only
      if (name === "text") {
        adjustTextareaHeight(e.target);
      }

      setEditedTask((prev) => ({ ...prev, [name]: value }));
    } else if (mode === "search") {
      // Search mode
      onSearchChange?.(name as keyof SearchState, value);
    }
  };

  const updateDateFormat = () => {
    if (mode === "add") {
      if (
        newTask.date &&
        (newTask.date.match(/^\d{2}$/) || newTask.date.match(/^\d{4}$/))
      ) {
        const formattedDate = formatDate(newTask.date);
        setNewTask((prev) => ({ ...prev, date: formattedDate }));
      }
    } else if (mode === "edit") {
      if (
        editedTask.date &&
        (editedTask.date.match(/^\d{2}$/) || editedTask.date.match(/^\d{4}$/))
      ) {
        const formattedDate = formatDate(editedTask.date);
        setEditedTask((prev) => ({ ...prev, date: formattedDate }));
      }
    }
  };

  const updateTimeFormat = () => {
    if (mode === "add") {
      if (newTask.time && newTask.time.match(/^\d{2}$/)) {
        setNewTask((prev) => ({ ...prev, time: `${newTask.time}:00` }));
      }
    } else if (mode === "edit") {
      if (editedTask.time && editedTask.time.match(/^\d{2}$/)) {
        setEditedTask((prev) => ({ ...prev, time: `${editedTask.time}:00` }));
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (mode === "add" || mode === "edit") {
      if (e.target.name === "date") {
        updateDateFormat();
      } else if (e.target.name === "time") {
        updateTimeFormat();
      }
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

    if (newTask.date || newTask.time || newTask.text) {
      const taskToAdd = {
        date: newTask.date.trim() || getCurrentDate(),
        time: newTask.time.trim() || getCurrentTime(),
        text: newTask.text,
      };

      onAddTask?.(taskToAdd);
      setNewTask({ date: "", time: "", text: "" });
      deleteDraft(); // Delete draft after successful submission
    }
  };

  const handleSaveEdit = () => {
    if (mode !== "edit") return;

    if (editedTask.date || editedTask.time || editedTask.text) {
      onSaveEdit?.(editedTask);
      deleteDraft(); // Delete draft after successful submission
    }
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
      return { date: "Add Date", time: "Add Time", text: "Add Task" };
    } else if (mode === "edit") {
      return { date: "Date", time: "Time", text: "Task" };
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
            autoFocus={mode === "edit"}
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
            placeholder={placeholders.time}
            ref={timeTextareaRef}
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

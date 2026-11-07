import React, { useEffect, useRef, useState } from "react";
import { ITask, SearchState, TaskFormData } from "@/types";
import {
  debounce,
  formatDate,
  formatTime,
  getCurrentDate,
  getCurrentTime,
  isValidDateString,
  isValidTimeString,
} from "@/lib/utils";
import { CloseIcon, PlusIcon, SaveIcon, SearchIcon } from "./Icons";

type Field = keyof TaskFormData;

interface InputRowProps {
  mode: "add" | "search" | "edit";
  onAddTask?: (task: TaskFormData) => void;
  searchTerms?: SearchState;
  onSearchChange?: (field: keyof SearchState, value: string) => void;
  editTask?: ITask;
  onSaveEdit?: (task: ITask) => void;
  onCancelEdit?: () => void;
}

const EMPTY: TaskFormData = { date: "", time: "", text: "" };

const PLACEHOLDERS: Record<InputRowProps["mode"], TaskFormData> = {
  add: { date: "Date", time: "Time", text: "Write New Task" },
  edit: { date: "Date", time: "Time", text: "Task" },
  search: { date: "Date", time: "Time", text: "Search Tasks" },
};

const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + 16 + "px";
};

const createDraftSaver = () => {
  let last: Promise<unknown> = Promise.resolve();
  const save = debounce((body: Record<string, unknown>) => {
    last = fetch("/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => undefined);
  }, 500);
  return { save, cancel: save.cancel, settled: () => last };
};

const draftParams = (mode: "add" | "edit", taskId?: string) => {
  const params = new URLSearchParams({ mode });
  if (mode === "edit" && taskId) params.set("taskId", taskId);
  return params.toString();
};

const InputRow = ({
  mode,
  onAddTask,
  searchTerms,
  onSearchChange,
  editTask,
  onSaveEdit,
  onCancelEdit,
}: InputRowProps) => {
  const isForm = mode === "add" || mode === "edit";
  const draftTaskId = editTask?._id;

  const [form, setForm] = useState<TaskFormData>(() =>
    mode === "edit" && editTask
      ? {
          date: editTask.date || "",
          time: editTask.time || "",
          text: editTask.text || "",
        }
      : EMPTY
  );
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [userTouched, setUserTouched] = useState(false);
  const [invalid, setInvalid] = useState<{ date: boolean; time: boolean }>({
    date: false,
    time: false,
  });

  const timeRef = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [draftSaver] = useState(createDraftSaver);

  useEffect(() => {
    if (!isForm || draftLoaded) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/drafts?${draftParams(mode, draftTaskId)}`);
        if (!res.ok || cancelled) return;
        const draft = await res.json();
        if (draft && !cancelled) {
          setForm({
            date: draft.date || "",
            time: draft.time || "",
            text: draft.text || "",
          });
        }
      } catch {
      } finally {
        if (!cancelled) setDraftLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isForm, mode, draftTaskId, draftLoaded]);

  useEffect(() => {
    if (!isForm || !draftLoaded || !userTouched) return;
    draftSaver.save({ mode, taskId: draftTaskId, ...form });
  }, [form, isForm, draftLoaded, mode, draftTaskId, userTouched, draftSaver]);

  const values: TaskFormData = isForm ? form : (searchTerms ?? EMPTY);

  useEffect(() => {
    if (textRef.current) adjustTextareaHeight(textRef.current);
  }, [values.text]);

  const setField = (field: Field, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setInvalidField = (field: "date" | "time", value: boolean) =>
    setInvalid((prev) => ({ ...prev, [field]: value }));

  const deleteDraft = async () => {
    const draftMode = mode === "edit" ? "edit" : "add";
    await draftSaver.settled();
    try {
      await fetch(`/api/drafts?${draftParams(draftMode, draftTaskId)}`, {
        method: "DELETE",
      });
    } catch {}
  };

  const applyFormat = (field: "date" | "time", raw: string): boolean => {
    const formatted = field === "date" ? formatDate(raw) : formatTime(raw);
    const valid =
      field === "date"
        ? isValidDateString(formatted)
        : isValidTimeString(formatted);
    setField(field, formatted);
    setInvalidField(field, !valid);
    return valid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const name = e.target.name as Field;
    let { value } = e.target;

    if (!isForm) {
      if (name === "text") adjustTextareaHeight(e.target);
      onSearchChange?.(name, value);
      return;
    }

    setUserTouched(true);

    if (name === "date") {
      value = value.replace(/[:/\-]/g, ".");
      setInvalidField("date", false);
      if (/^\d{6}$/.test(value)) {
        if (applyFormat("date", value)) timeRef.current?.focus();
        return;
      }
    } else if (name === "time") {
      value = value.replace(/[./\-]/g, ":");
      setInvalidField("time", false);
      if (/^\d{4}$/.test(value)) {
        if (applyFormat("time", value)) textRef.current?.focus();
        return;
      }
    } else {
      adjustTextareaHeight(e.target);
    }

    setField(name, value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (!isForm) return;
    const name = e.target.name;
    if (name !== "date" && name !== "time") return;
    if (!e.target.value) {
      setInvalidField(name, false);
      return;
    }
    applyFormat(name, e.target.value);
  };

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (!isForm) return;
    const name = e.target.name;
    if ((name === "date" || name === "time") && invalid[name]) {
      setField(name, "");
      setInvalidField(name, false);
    }
  };

  const insertLineBreak = (textarea: HTMLTextAreaElement) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    setField("text", value.substring(0, start) + "\n" + value.substring(end));
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 1;
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" && mode === "edit") {
      onCancelEdit?.();
      return;
    }
    if (e.key !== "Enter") return;

    if (!isForm) {
      e.preventDefault();
      return;
    }

    const name = e.currentTarget.name as Field;

    if (name === "date") {
      e.preventDefault();
      if (!form.date.trim()) {
        setField("date", mode === "add" ? getCurrentDate() : "");
        setInvalidField("date", false);
      } else {
        applyFormat("date", form.date);
      }
      timeRef.current?.focus();
      return;
    }

    if (name === "time") {
      e.preventDefault();
      if (!form.time.trim()) {
        setField("time", mode === "add" ? getCurrentTime() : "");
        setInvalidField("time", false);
      } else {
        applyFormat("time", form.time);
      }
      textRef.current?.focus();
      return;
    }

    const hasModifier = e.metaKey || e.altKey || e.ctrlKey;
    if (e.shiftKey && !hasModifier) {
      e.preventDefault();
      submit();
    } else if (hasModifier) {
      e.preventDefault();
      insertLineBreak(e.currentTarget);
    }
  };

  const submit = () => {
    if (!isForm) return;
    if (!(form.date || form.time || form.text)) return;

    const formattedDate = form.date.trim() ? formatDate(form.date) : "";
    const formattedTime = form.time.trim() ? formatTime(form.time) : "";

    if (formattedDate && !isValidDateString(formattedDate)) {
      setField("date", formattedDate);
      setInvalidField("date", true);
      return;
    }
    if (formattedTime && !isValidTimeString(formattedTime)) {
      setField("time", formattedTime);
      setInvalidField("time", true);
      return;
    }

    if (mode === "add") {
      onAddTask?.({
        date: formattedDate || getCurrentDate(),
        time: formattedTime || getCurrentTime(),
        text: form.text,
      });
      setForm(EMPTY);
    } else if (editTask) {
      onSaveEdit?.({
        ...editTask,
        date: formattedDate,
        time: formattedTime,
        text: form.text,
      });
    }

    setInvalid({ date: false, time: false });
    setUserTouched(false);
    draftSaver.cancel();
    deleteDraft();
  };

  const placeholders = PLACEHOLDERS[mode];

  const fieldProps = (field: "date" | "time") => {
    const isInvalid = isForm && invalid[field];
    return {
      name: field,
      value: values[field],
      placeholder: placeholders[field],
      rows: 1,
      maxLength: field === "date" ? 10 : 5,
      className: isInvalid ? "invalid" : undefined,
      "aria-invalid": isInvalid ? true : undefined,
      title: isInvalid
        ? field === "date"
          ? "Please enter a valid date (DD.MM.YYYY)"
          : "Please enter a valid time (HH:MM)"
        : undefined,
    };
  };

  return (
    <div className="task-item task-item-input">
      <div className="task-datetime-container">
        <div className="task-item-date">
          <textarea
            {...fieldProps("date")}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={handleFocus}
            autoFocus={mode === "edit"}
          />
        </div>
        <div className="task-item-time">
          <textarea
            {...fieldProps("time")}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={handleFocus}
            ref={timeRef}
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
          ref={textRef}
          rows={2}
          maxLength={5000}
        />
      </div>

      <div className="task-item-actions">
        {mode === "add" && (
          <button
            onClick={submit}
            className="btn btn-primary"
            title="Add task"
            aria-label="Add task"
          >
            <PlusIcon />
          </button>
        )}

        {mode === "search" && (
          <span className="btn btn-primary btn-static" title="Search">
            <SearchIcon />
          </span>
        )}

        {mode === "edit" && (
          <>
            <button
              onClick={() => onCancelEdit?.()}
              className="btn btn-secondary"
              title="Cancel"
              aria-label="Cancel"
            >
              <CloseIcon />
            </button>
            <button
              onClick={submit}
              className="btn btn-success"
              title="Save"
              aria-label="Save"
            >
              <SaveIcon />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default InputRow;

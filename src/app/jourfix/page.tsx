// src/app/jourfix/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { ISeries, SeriesFormData } from "@/types";
import { formatTime, isValidTimeString } from "@/lib/utils";
import "@/styles/styles.css";

const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

const emptyForm: SeriesFormData = { weekday: 1, time: "", text: "" };

const JourFix = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [series, setSeries] = useState<ISeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SeriesFormData>(emptyForm);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") {
      if (status === "unauthenticated") setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/series");
        if (res.status === 401) return router.push("/login");
        if (!res.ok) throw new Error((await res.json()).error || "Load failed");
        setSeries(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [status, router]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = async () => {
    const time = form.time.trim() ? formatTime(form.time) : "";
    if (!time || !isValidTimeString(time)) {
      setError("Bitte gültige Uhrzeit (HH:MM) eingeben.");
      return;
    }
    if (!form.text.trim()) {
      setError("Bitte Text eingeben.");
      return;
    }
    setError(null);

    const payload = { weekday: form.weekday, time, text: form.text.trim() };
    const url = editingId ? `/api/series/${editingId}` : "/api/series";
    const method = editingId ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      const saved: ISeries = await res.json();
      setSeries((prev) => {
        const next = editingId
          ? prev.map((s) => (s._id === saved._id ? saved : s))
          : [...prev, saved];
        return next.sort(
          (a, b) => a.weekday - b.weekday || a.time.localeCompare(b.time)
        );
      });
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const startEdit = (s: ISeries) => {
    setEditingId(s._id || null);
    setForm({ weekday: s.weekday, time: s.time, text: s.text });
  };

  const remove = async (id: string) => {
    if (!window.confirm("Serie löschen? Zukünftige offene Instanzen werden mitgelöscht.")) return;
    try {
      const res = await fetch(`/api/series/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
      setSeries((prev) => prev.filter((s) => s._id !== id));
      if (editingId === id) resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  if (status === "loading" || loading) {
    return <div className="loading">Loading...</div>;
  }
  if (status === "unauthenticated") return null;

  return (
    <div className="app-container">
      <Header
        title="JourFix"
        currentPage="jourfix"
        userName={session?.user?.name || ""}
      />
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      <div className="container">
        <div className="task-item task-item-input">
          <div className="task-datetime-container">
            <div className="task-item-date">
              <select
                value={form.weekday}
                onChange={(e) =>
                  setForm((f) => ({ ...f, weekday: parseInt(e.target.value) }))
                }
                className="jourfix-weekday"
              >
                {WEEKDAYS.map((d, i) => (
                  <option key={i} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="task-item-time">
              <textarea
                name="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                onBlur={(e) =>
                  setForm((f) => ({ ...f, time: formatTime(e.target.value) }))
                }
                placeholder="Time"
                rows={1}
              />
            </div>
          </div>
          <div className="task-item-text">
            <textarea
              name="text"
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              placeholder={editingId ? "Serie bearbeiten" : "Neue Serie"}
              rows={2}
            />
          </div>
          <div className="task-item-actions">
            {editingId && (
              <button
                onClick={resetForm}
                className="btn btn-primary"
                title="Cancel"
              >
                ✕
              </button>
            )}
            <button onClick={submit} className="btn btn-success" title="Save">
              {editingId ? "✓" : "+"}
            </button>
          </div>
        </div>

        {series.map((s, i) => (
          <div
            key={s._id}
            className={`task-item ${i % 2 === 0 ? "" : "even"}`}
          >
            <div className="task-datetime-container">
              <div className="task-item-date">{WEEKDAYS[s.weekday]}</div>
              <div className="task-item-time">{s.time}</div>
            </div>
            <div className="task-item-text">
              {s.text.split("\n").map((line, j) => (
                <span key={j}>{line}</span>
              ))}
            </div>
            <div className="task-item-actions">
              <button
                onClick={() => startEdit(s)}
                className="btn btn-primary"
                title="Edit"
              >
                ✎
              </button>
              <button
                onClick={() => remove(s._id as string)}
                className="btn btn-danger"
                title="Delete"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JourFix;

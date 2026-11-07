"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { IBirthday } from "@/types";
import { daysInMonth } from "@/lib/utils";
import { createCache } from "@/lib/localCache";
import {
  CloseIcon,
  EditIcon,
  PlusIcon,
  SaveIcon,
  TrashIcon,
} from "@/components/Icons";

const birthdayCache = createCache<IBirthday>("birthdays");

type DayMonth = { day: number; month: number };
type BirthdayInput = DayMonth & { name: string };

const pad2 = (n: number) => String(n).padStart(2, "0");

const formatDayMonth = (day: number, month: number) =>
  `${pad2(day)}.${pad2(month)}`;

const parseDayMonth = (input: string): DayMonth | null => {
  const match =
    input.match(/^(\d{2})(\d{2})$/) ?? input.match(/^(\d{1,2})\.(\d{1,2})\.?$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(month)) return null;
  return { day, month };
};

const sortBirthdays = (list: IBirthday[]): IBirthday[] =>
  [...list].sort((a, b) => a.month - b.month || a.day - b.day);

const BirthdaySkeleton = () => (
  <div className="birthday-row" aria-hidden="true">
    <div className="birthday-date">
      <div className="skeleton-bar" />
    </div>
    <div className="birthday-name">
      <div className="skeleton-bar" style={{ width: "60%" }} />
    </div>
    <div className="birthday-actions" />
  </div>
);

interface BirthdayFormProps {
  mode: "add" | "edit";
  initial?: { date: string; name: string };
  onSubmit: (data: BirthdayInput) => Promise<boolean>;
  onCancel?: () => void;
  onError: (message: string) => void;
}

const BirthdayForm = ({
  mode,
  initial,
  onSubmit,
  onCancel,
  onError,
}: BirthdayFormProps) => {
  const [date, setDate] = useState(initial?.date ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [dateInvalid, setDateInvalid] = useState(false);
  const dateRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const focusDate = () => {
    dateRef.current?.focus();
    dateRef.current?.select();
  };

  const applyDate = (raw: string): boolean => {
    const parsed = parseDayMonth(raw);
    if (!parsed) {
      setDateInvalid(raw !== "");
      return false;
    }
    setDate(formatDayMonth(parsed.day, parsed.month));
    setDateInvalid(false);
    return true;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.]/g, "");
    setDateInvalid(false);
    setDate(value);
    if (/^\d{4}$/.test(value) && applyDate(value)) nameRef.current?.focus();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseDayMonth(date);
    const trimmed = name.trim();
    if (!parsed) {
      onError("Please enter a valid date as DDMM, e.g. 1310 for 13.10.");
      setDateInvalid(true);
      focusDate();
      return;
    }
    if (!trimmed) {
      onError("Please enter a name.");
      nameRef.current?.focus();
      return;
    }
    const ok = await onSubmit({ ...parsed, name: trimmed });
    if (ok && mode === "add") {
      setDate("");
      setName("");
      setDateInvalid(false);
      focusDate();
    }
  };

  return (
    <form
      className="birthday-row birthday-row-input"
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === "Escape" && mode === "edit") onCancel?.();
      }}
    >
      <div className="birthday-date">
        <input
          type="text"
          inputMode="numeric"
          value={date}
          ref={dateRef}
          autoFocus={mode === "edit"}
          onChange={handleDateChange}
          onBlur={(e) => {
            if (e.target.value) applyDate(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (applyDate(date)) nameRef.current?.focus();
              else focusDate();
            }
          }}
          placeholder="Date"
          className={dateInvalid ? "invalid" : undefined}
          aria-invalid={dateInvalid || undefined}
          title={dateInvalid ? "Enter the date as DDMM, e.g. 1310" : undefined}
          aria-label="Date"
        />
      </div>
      <div className="birthday-name">
        <input
          type="text"
          value={name}
          ref={nameRef}
          onChange={(e) => setName(e.target.value)}
          placeholder={mode === "add" ? "New Birthday" : "Name"}
          maxLength={200}
          aria-label="Name"
        />
      </div>
      <div className="birthday-actions">
        {mode === "add" ? (
          <button
            type="submit"
            className="btn btn-primary"
            title="Add birthday"
            aria-label="Add birthday"
          >
            <PlusIcon />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              title="Cancel"
              aria-label="Cancel"
            >
              <CloseIcon />
            </button>
            <button
              type="submit"
              className="btn btn-success"
              title="Save"
              aria-label="Save"
            >
              <SaveIcon />
            </button>
          </>
        )}
      </div>
    </form>
  );
};

const Birthdays = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = session?.user?.id;

  const [birthdays, setBirthdays] = useState<IBirthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !userId) return;

    let cancelled = false;
    const cached = birthdayCache.load(userId);
    (async () => {
      if (cached) {
        setBirthdays(sortBirthdays(cached.items));
        setLoading(false);
      }
      try {
        const res = await fetch("/api/birthdays");
        if (res.status === 401) return router.push("/login");
        if (!res.ok) {
          throw new Error(
            (await res.json()).error || "Could not load birthdays"
          );
        }
        const list: IBirthday[] = await res.json();
        if (cancelled) return;
        setBirthdays(sortBirthdays(list));
        birthdayCache.save(userId, list);
      } catch (e) {
        if (!cancelled && !cached) {
          setError(
            e instanceof TypeError
              ? "Offline: birthdays are not available without a connection."
              : e instanceof Error
                ? e.message
                : "Could not reach the server"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, userId, router]);

  const persist = (updater: (prev: IBirthday[]) => IBirthday[]) => {
    setBirthdays((prev) => {
      const next = sortBirthdays(updater(prev));
      if (userId) birthdayCache.save(userId, next);
      return next;
    });
  };

  const save = async (
    data: BirthdayInput,
    id: string | null
  ): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch(id ? `/api/birthdays/${id}` : "/api/birthdays", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 401) {
        router.push("/login");
        return false;
      }
      if (!res.ok) {
        throw new Error((await res.json()).error || "Save failed");
      }
      const saved: IBirthday = await res.json();
      persist((prev) =>
        id ? prev.map((b) => (b._id === saved._id ? saved : b)) : [...prev, saved]
      );
      if (id) setEditingId(null);
      return true;
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Offline: birthdays cannot be saved without a connection."
          : err instanceof Error
            ? err.message
            : "Save failed"
      );
      return false;
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete birthday?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/birthdays/${id}`, { method: "DELETE" });
      if (res.status === 401) return router.push("/login");
      if (!res.ok) {
        throw new Error((await res.json()).error || "Delete failed");
      }
      persist((prev) => prev.filter((b) => b._id !== id));
      if (editingId === id) setEditingId(null);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Offline: birthdays cannot be deleted without a connection."
          : err instanceof Error
            ? err.message
            : "Delete failed"
      );
    }
  };

  if (status !== "authenticated") return null;

  return (
    <div className="app-container">
      <Header
        currentPage="birthdays"
        userName={session?.user?.name || ""}
      />
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      <div className="container">
        <BirthdayForm
          mode="add"
          onSubmit={(data) => save(data, null)}
          onError={setError}
        />

        {loading && birthdays.length === 0 && (
          <>
            <BirthdaySkeleton />
            <BirthdaySkeleton />
            <BirthdaySkeleton />
          </>
        )}

        {birthdays.map((b, i) =>
          b._id === editingId ? (
            <BirthdayForm
              key={b._id}
              mode="edit"
              initial={{ date: formatDayMonth(b.day, b.month), name: b.name }}
              onSubmit={(data) => save(data, b._id as string)}
              onCancel={() => setEditingId(null)}
              onError={setError}
            />
          ) : (
            <div
              key={b._id}
              className={`birthday-row ${i % 2 === 1 ? "even" : ""}`}
            >
              <div className="birthday-date">
                {formatDayMonth(b.day, b.month)}
              </div>
              <div className="birthday-name">{b.name}</div>
              <div className="birthday-actions">
                <button
                  onClick={() => setEditingId(b._id as string)}
                  className="btn btn-primary"
                  title="Edit"
                  aria-label="Edit"
                >
                  <EditIcon />
                </button>
                <button
                  onClick={() => remove(b._id as string)}
                  className="btn btn-danger"
                  title="Delete"
                  aria-label="Delete"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Birthdays;

// src/lib/utils.ts
import { ITask } from "@/types";
/**
 * Convert date string to sort value
 */
export const getDateSortValue = (dateStr: string): number => {
  if (!dateStr) return Infinity;
  const match = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (match) {
    const [_, day, month, year] = match;
    return parseInt(`${year}${month}${day}`);
  }
  return Infinity;
};

/**
 * Convert time string to sort value
 */
export const getTimeSortValue = (timeStr: string): number => {
  if (!timeStr) return Infinity;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const [_, hours, minutes] = match;
    return parseInt(`${hours.padStart(2, "0")}${minutes}`);
  }
  return Infinity;
};

/**
 * Sort tasks by date and time
 */
export const sortTasks = (tasks: any[]): any[] => {
  return [...tasks].sort((a, b) => {
    // Handle empty tasks
    const aEmpty = !a.date && !a.time && !a.text;
    const bEmpty = !b.date && !b.time && !b.text;

    if (aEmpty && !bEmpty) return 1;
    if (!aEmpty && bEmpty) return -1;
    if (aEmpty && bEmpty) return 0;

    // Compare dates
    const dateA = getDateSortValue(a.date);
    const dateB = getDateSortValue(b.date);

    if (dateA !== dateB) {
      return dateA - dateB;
    }

    // If dates are the same, compare times
    const timeA = getTimeSortValue(a.time);
    const timeB = getTimeSortValue(b.time);

    return timeA - timeB;
  });
};

/**
 * Format date from various input formats.
 * Returns canonical format: "DD.MM.YYYY".
 *
 * Accepts:
 * - Pure digits (1–6 chars): odd lengths get a leading-zero pad
 *   "5" → "05.MM.YYYY", "504" → "05.04.YYYY", "040525" → "04.05.2025"
 * - Mixed inputs with ".", ":", "-" or "/" as separators
 *   "1.5.25" → "01.05.2025", "12-05-2026" → "12.05.2026"
 * - Already-canonical "DD.MM.YYYY" → returned unchanged
 *
 * If the input cannot be interpreted, the original string is returned
 * unchanged so the caller can show invalid feedback.
 */
export const formatDate = (inputDate: string): string => {
  const today = new Date();
  const currentMonth = (today.getMonth() + 1).toString().padStart(2, "0");
  const currentYear = today.getFullYear();

  if (!inputDate) return "";

  // Already canonical
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(inputDate)) {
    return inputDate;
  }

  const expandYear = (y: string): string => {
    if (y.length === 4) return y;
    if (y.length === 2) return (2000 + parseInt(y)).toString();
    if (y.length === 1) return (2000 + parseInt(y)).toString().padStart(4, "0");
    if (y.length === 3) return y.padStart(4, "0");
    return y;
  };

  // Mixed input with separators — split into components
  if (/[.:\-/]/.test(inputDate)) {
    const parts = inputDate.split(/[.:\-/]/).filter((p) => p !== "");
    if (parts.length > 0 && parts.every((p) => /^\d+$/.test(p))) {
      if (parts.length === 1) {
        return `${parts[0].padStart(2, "0")}.${currentMonth}.${currentYear}`;
      }
      if (parts.length === 2) {
        return `${parts[0].padStart(2, "0")}.${parts[1].padStart(2, "0")}.${currentYear}`;
      }
      if (parts.length === 3) {
        return `${parts[0].padStart(2, "0")}.${parts[1].padStart(2, "0")}.${expandYear(parts[2])}`;
      }
    }
    return inputDate;
  }

  // Pure digits — pad odd lengths to next even
  const cleanDigits = inputDate.replace(/\D/g, "");
  if (cleanDigits.length < 1 || cleanDigits.length > 6) {
    return inputDate;
  }
  const padded =
    cleanDigits.length % 2 === 1 ? "0" + cleanDigits : cleanDigits;

  if (padded.length === 6) {
    const day = padded.substring(0, 2);
    const month = padded.substring(2, 4);
    const year = 2000 + parseInt(padded.substring(4, 6));
    return `${day}.${month}.${year}`;
  }
  if (padded.length === 4) {
    const day = padded.substring(0, 2);
    const month = padded.substring(2, 4);
    return `${day}.${month}.${currentYear}`;
  }
  return `${padded}.${currentMonth}.${currentYear}`;
};

/**
 * Format time from various input formats.
 * Returns canonical format: "HH:MM".
 *
 * Accepts:
 * - Pure digits (1–4 chars): odd lengths get a leading-zero pad
 *   "8" → "08:00", "830" → "08:30", "0830" → "08:30"
 * - Mixed inputs with ".", ":", "-" or "/" as separators
 *   "8.30" → "08:30", "8-30" → "08:30"
 * - Already-canonical "HH:MM" → returned unchanged
 */
export const formatTime = (inputTime: string): string => {
  if (!inputTime) return "";

  if (/^\d{2}:\d{2}$/.test(inputTime)) {
    return inputTime;
  }

  if (/[.:\-/]/.test(inputTime)) {
    const parts = inputTime.split(/[.:\-/]/).filter((p) => p !== "");
    if (parts.length > 0 && parts.every((p) => /^\d+$/.test(p))) {
      if (parts.length === 1) {
        return `${parts[0].padStart(2, "0")}:00`;
      }
      if (parts.length === 2) {
        return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
      }
    }
    return inputTime;
  }

  const cleanDigits = inputTime.replace(/\D/g, "");
  if (cleanDigits.length < 1 || cleanDigits.length > 4) {
    return inputTime;
  }
  const padded =
    cleanDigits.length % 2 === 1 ? "0" + cleanDigits : cleanDigits;

  if (padded.length === 4) {
    return `${padded.substring(0, 2)}:${padded.substring(2, 4)}`;
  }
  return `${padded}:00`;
};

/**
 * Validate canonical date string "DD.MM.YYYY" — checks ranges and real calendar dates
 * (e.g. Feb 30 is rejected).
 */
export const isValidDateString = (dateStr: string): boolean => {
  const match = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return false;
  const day = parseInt(match[1]);
  const month = parseInt(match[2]);
  const year = parseInt(match[3]);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2199) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

/**
 * Validate canonical time string "HH:MM".
 */
export const isValidTimeString = (timeStr: string): boolean => {
  const match = timeStr.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
};

/**
 * Get weekday from date string
 * Returns German weekday abbreviation
 */
export const getWeekdayFromDate = (dateStr: string): string => {
  if (!dateStr) return "";

  const match = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return "";

  const [_, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}`);
  if (isNaN(date.getTime())) return "";
  const days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  return days[date.getDay()];
};

/**
 * Format time with weekday for display
 * Returns: "Mo, 08:00" or just "08:00" if no date provided
 */
export const formatTimeDisplay = (
  timeStr: string,
  dateStr?: string
): string => {
  if (!timeStr) return "";

  if (dateStr) {
    const weekday = getWeekdayFromDate(dateStr);
    return weekday ? `${weekday}, ${timeStr}` : timeStr;
  }

  return timeStr;
};

/**
 * Create a standard HTTP request handler
 */
export const createApiHandler = (handler: Function) => {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      return { error: errorMessage, status: 500 };
    }
  };
};

/**
 * Check if this task needs a divider line and what type
 * Returns null for no divider, "month" for red month divider, "year" for blue year divider
 */
export const addDivider = (
  currentTask: ITask,
  nextTask: ITask | null
): string | null => {
  if (!nextTask || !currentTask.date || !nextTask.date) return null;

  const currentYear = currentTask.date.substring(6, 10); // "YYYY"
  const nextYear = nextTask.date.substring(6, 10); // "YYYY"

  // Check if year changes - year divider has priority
  if (currentYear !== nextYear) return "year";

  const currentMonth = currentTask.date.substring(3, 10); // "MM.YYYY"
  const nextMonth = nextTask.date.substring(3, 10); // "MM.YYYY"

  // If same year but different month AND current year - month divider
  if (
    currentMonth !== nextMonth &&
    currentYear === new Date().getFullYear().toString()
  )
    return "month";

  return null;
};

export type DebouncedFunction<T extends (...args: any[]) => void> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
};

/**
 * Debounce function with a cancel() method to abort a pending invocation.
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): DebouncedFunction<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      func(...args);
    }, delay);
  }) as DebouncedFunction<T>;

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
};

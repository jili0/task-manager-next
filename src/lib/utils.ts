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
 * Format date from various input formats
 * Returns clean date format: "DD.MM.YYYY" (without weekday)
 * Supports:
 * - "04" (day only)
 * - "0405" (day and month)
 * - "040525" (day, month, year)
 */
export const formatDate = (inputDate: string): string => {
  const today = new Date();
  const currentMonth = (today.getMonth() + 1).toString().padStart(2, "0");
  const currentYear = today.getFullYear();

  // Format complete date (day, month, year: "040525")
  if (inputDate.match(/^\d{6}$/)) {
    const day = inputDate.substring(0, 2);
    const month = inputDate.substring(2, 4);
    const year = 2000 + parseInt(inputDate.substring(4, 6));

    return `${day}.${month}.${year}`;
  }

  // Format day and month ("0405")
  if (inputDate.match(/^\d{4}$/)) {
    const day = inputDate.substring(0, 2);
    const month = inputDate.substring(2, 4);

    return `${day}.${month}.${currentYear}`;
  }

  // Format day only ("04")
  if (inputDate.match(/^\d{2}$/)) {
    const day = inputDate;
    const month = currentMonth;

    return `${day}.${month}.${currentYear}`;
  }

  return inputDate;
};

/**
 * Format time from various input formats
 * Returns clean time format: "HH:MM" (without weekday)
 * Supports:
 * - "08" (hours only)
 * - "0800" (hours and minutes)
 */
export const formatTime = (inputTime: string): string => {
  // Format hours and minutes ("0800")
  if (inputTime.match(/^\d{4}$/)) {
    const hours = inputTime.substring(0, 2);
    const minutes = inputTime.substring(2, 4);
    return `${hours}:${minutes}`;
  }

  // Format hours only ("08")
  if (inputTime.match(/^\d{2}$/)) {
    return `${inputTime}:00`;
  }

  return inputTime;
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
    currentYear == new Date().getFullYear().toString()
  )
    return "month";

  return null;
};
/**
 * Debounce function to limit API calls
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

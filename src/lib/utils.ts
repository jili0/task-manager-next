import { ITask } from "@/types";

const NO_VALUE = Number.MAX_SAFE_INTEGER;

export const getDateSortValue = (dateStr: string): number => {
  const match = dateStr?.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return NO_VALUE;
  const [, day, month, year] = match;
  return parseInt(`${year}${month}${day}`);
};

export const getTimeSortValue = (timeStr: string): number => {
  const match = timeStr?.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return NO_VALUE;
  const [, hours, minutes] = match;
  return parseInt(`${hours.padStart(2, "0")}${minutes}`);
};

const isEmptyTask = (t: ITask) => !t.date && !t.time && !t.text;

export const sortTasks = (tasks: ITask[]): ITask[] =>
  [...tasks].sort((a, b) => {
    const aEmpty = isEmptyTask(a);
    const bEmpty = isEmptyTask(b);
    if (aEmpty !== bEmpty) return aEmpty ? 1 : -1;
    if (aEmpty) return 0;
    return (
      getDateSortValue(a.date) - getDateSortValue(b.date) ||
      getTimeSortValue(a.time) - getTimeSortValue(b.time)
    );
  });

const pad2 = (n: number | string) => String(n).padStart(2, "0");

export const getCurrentDate = (): string => {
  const today = new Date();
  return `${pad2(today.getDate())}.${pad2(today.getMonth() + 1)}.${today.getFullYear()}`;
};

export const getCurrentTime = (): string => {
  const now = new Date();
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
};

export const formatDate = (inputDate: string): string => {
  if (!inputDate) return "";
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(inputDate)) return inputDate;

  const today = new Date();
  const currentMonth = pad2(today.getMonth() + 1);
  const currentYear = today.getFullYear();

  const expandYear = (y: string): string => {
    if (y.length === 4) return y;
    if (y.length <= 2) return String(2000 + parseInt(y));
    if (y.length === 3) return y.padStart(4, "0");
    return y;
  };

  if (/[.:\-/]/.test(inputDate)) {
    const parts = inputDate.split(/[.:\-/]/).filter((p) => p !== "");
    if (parts.length > 0 && parts.every((p) => /^\d+$/.test(p))) {
      if (parts.length === 1) {
        return `${pad2(parts[0])}.${currentMonth}.${currentYear}`;
      }
      if (parts.length === 2) {
        return `${pad2(parts[0])}.${pad2(parts[1])}.${currentYear}`;
      }
      if (parts.length === 3) {
        return `${pad2(parts[0])}.${pad2(parts[1])}.${expandYear(parts[2])}`;
      }
    }
    return inputDate;
  }

  const cleanDigits = inputDate.replace(/\D/g, "");
  if (cleanDigits.length < 1 || cleanDigits.length > 6) return inputDate;
  const padded = cleanDigits.length % 2 === 1 ? "0" + cleanDigits : cleanDigits;

  if (padded.length === 6) {
    return `${padded.substring(0, 2)}.${padded.substring(2, 4)}.${2000 + parseInt(padded.substring(4, 6))}`;
  }
  if (padded.length === 4) {
    return `${padded.substring(0, 2)}.${padded.substring(2, 4)}.${currentYear}`;
  }
  return `${padded}.${currentMonth}.${currentYear}`;
};

export const formatTime = (inputTime: string): string => {
  if (!inputTime) return "";
  if (/^\d{2}:\d{2}$/.test(inputTime)) return inputTime;

  if (/[.:\-/]/.test(inputTime)) {
    const parts = inputTime.split(/[.:\-/]/).filter((p) => p !== "");
    if (parts.length > 0 && parts.every((p) => /^\d+$/.test(p))) {
      if (parts.length === 1) return `${pad2(parts[0])}:00`;
      if (parts.length === 2) return `${pad2(parts[0])}:${pad2(parts[1])}`;
    }
    return inputTime;
  }

  const cleanDigits = inputTime.replace(/\D/g, "");
  if (cleanDigits.length < 1 || cleanDigits.length > 4) return inputTime;
  const padded = cleanDigits.length % 2 === 1 ? "0" + cleanDigits : cleanDigits;

  if (padded.length === 4) {
    return `${padded.substring(0, 2)}:${padded.substring(2, 4)}`;
  }
  return `${padded}:00`;
};

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

export const isValidTimeString = (timeStr: string): boolean => {
  const match = timeStr.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
};

export const getWeekdayFromDate = (dateStr: string): string => {
  const match = dateStr?.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return "";
  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}`);
  if (isNaN(date.getTime())) return "";
  return ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][date.getDay()];
};

export const formatTimeDisplay = (timeStr: string, dateStr?: string): string => {
  if (!timeStr) return "";
  const weekday = dateStr ? getWeekdayFromDate(dateStr) : "";
  return weekday ? `${weekday}, ${timeStr}` : timeStr;
};

export const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export const daysInMonth = (month: number, year?: number): number => {
  if (month === 2) return year === undefined || isLeapYear(year) ? 29 : 28;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
};

export const escapeRegExp = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const addDivider = (
  currentTask: ITask,
  nextTask: ITask | null
): "month" | "year" | null => {
  if (!nextTask || !currentTask.date || !nextTask.date) return null;

  const currentYear = currentTask.date.substring(6, 10);
  const nextYear = nextTask.date.substring(6, 10);
  if (currentYear !== nextYear) return "year";

  const currentMonth = currentTask.date.substring(3, 10);
  const nextMonth = nextTask.date.substring(3, 10);
  if (
    currentMonth !== nextMonth &&
    currentYear === String(new Date().getFullYear())
  ) {
    return "month";
  }
  return null;
};

export type DebouncedFunction<T extends (...args: never[]) => void> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
};

export const debounce = <T extends (...args: never[]) => void>(
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

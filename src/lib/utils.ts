// src/lib/utils.ts

/**
 * Convert date string to sort value
 */
export const getDateSortValue = (dateStr: string): number => {
  if (!dateStr) return Infinity;
  const match = dateStr.match(/^[A-Za-z]{2}, (\d{2})\.(\d{2})\.(\d{4})$/);
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
    return parseInt(`${hours.padStart(2, '0')}${minutes}`);
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
 * Supports:
 * - "04" (day only)
 * - "0405" (day and month)
 * - "040525" (day, month, year)
 */
export const formatDate = (inputDate: string): string => {
  const today = new Date();
  const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
  const currentYear = today.getFullYear();
  
  // Format complete date (day, month, year: "040525")
  if (inputDate.match(/^\d{6}$/)) {
    const day = inputDate.substring(0, 2);
    const month = inputDate.substring(2, 4);
    const year = 2000 + parseInt(inputDate.substring(4, 6));
    
    const date = new Date(`${year}-${month}-${day}`);
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']; // German weekdays
    const weekday = days[date.getDay()];
    
    return `${weekday}, ${day}.${month}.${year}`;
  }
  
  // Format day and month ("0405")
  if (inputDate.match(/^\d{4}$/)) {
    const day = inputDate.substring(0, 2);
    const month = inputDate.substring(2, 4);
    
    const date = new Date(`${currentYear}-${month}-${day}`);
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']; // German weekdays
    const weekday = days[date.getDay()];
    
    return `${weekday}, ${day}.${month}.${currentYear}`;
  }
  
  // Format day only ("04")
  if (inputDate.match(/^\d{2}$/)) {
    const day = inputDate;
    const month = currentMonth;
    
    const date = new Date(`${currentYear}-${month}-${day}`);
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']; // German weekdays
    const weekday = days[date.getDay()];
    
    return `${weekday}, ${day}.${month}.${currentYear}`;
  }
  
  return inputDate;
};

/**
 * Format time from various input formats
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
 * Create a standard HTTP request handler
 */
export const createApiHandler = (handler: Function) => {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred';
      
      return { error: errorMessage, status: 500 };
    }
  };
};
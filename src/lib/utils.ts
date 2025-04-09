export const getDateSortValue = (dateStr: string): number => {
  if (!dateStr) return Infinity;
  const match = dateStr.match(/^[A-Za-z]{2}, (\d{2})\.(\d{2})\.(\d{4})$/);
  if (match) {
    const [_, day, month, year] = match;
    return parseInt(`${year}${month}${day}`);
  }
  return Infinity;
};

export const getTimeSortValue = (timeStr: string): number => {
  if (!timeStr) return Infinity;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const [_, hours, minutes] = match;
    return parseInt(`${hours.padStart(2, '0')}${minutes}`);
  }
  return Infinity;
};

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
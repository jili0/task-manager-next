// src/lib/jourfix.ts
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import Series from "@/models/Series";
import User from "@/models/User";

export const TARGET_ACTIVE_INSTANCES = 13; // ~3 months of weekly instances

export const startOfDay = (d: Date): Date => {
  const result = new Date(d);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const parseDateString = (dateStr: string): Date | null => {
  const match = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const day = parseInt(match[1]);
  const month = parseInt(match[2]) - 1;
  const year = parseInt(match[3]);
  const date = new Date(year, month, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
};

export const formatDateString = (d: Date): string => {
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

export const nextWeekdayOnOrAfter = (from: Date, weekday: number): Date => {
  const result = new Date(from);
  const diff = (weekday - result.getDay() + 7) % 7;
  result.setDate(result.getDate() + diff);
  return result;
};

/**
 * For a single series, ensure there are TARGET_ACTIVE_INSTANCES future
 * isDone=false instances. Existing dates (active or tombstoned) are never
 * overwritten — new instances are appended after the latest known date.
 */
export const ensureFutureInstances = async (
  series: { _id: any; userId: string; weekday: number; time: string; text: string },
  today: Date
): Promise<number> => {
  const all = await Task.find({
    userId: series.userId,
    seriesId: series._id.toString(),
    isRecurring: true,
  });

  let activeFutureCount = 0;
  let latestExisting: Date | null = null;

  for (const t of all) {
    const d = parseDateString(t.date);
    if (!d) continue;
    if (d >= today) {
      if (!latestExisting || d > latestExisting) latestExisting = d;
      if (!t.isDone) activeFutureCount += 1;
    }
  }

  if (activeFutureCount >= TARGET_ACTIVE_INSTANCES) return 0;

  let cursor: Date;
  if (latestExisting) {
    cursor = new Date(latestExisting);
    cursor.setDate(cursor.getDate() + 7);
  } else {
    cursor = nextWeekdayOnOrAfter(today, series.weekday);
  }

  const needed = TARGET_ACTIVE_INSTANCES - activeFutureCount;
  const docs: any[] = [];
  for (let i = 0; i < needed; i++) {
    docs.push({
      userId: series.userId,
      seriesId: series._id.toString(),
      isRecurring: true,
      date: formatDateString(cursor),
      time: series.time,
      text: series.text,
      isDone: false,
    });
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() + 7);
  }

  if (docs.length > 0) {
    await Task.insertMany(docs);
  }
  return docs.length;
};

/**
 * Delete future undone instances of a series. Past instances and
 * already-done ones stay, so history is never rewritten.
 */
export const deleteFutureUndoneInstances = async (
  seriesId: string,
  userId: string,
  today: Date
): Promise<void> => {
  const candidates = await Task.find({
    userId,
    seriesId,
    isRecurring: true,
    isDone: false,
  });
  const ids = candidates
    .filter((t) => {
      const d = parseDateString(t.date);
      return d !== null && d >= today;
    })
    .map((t) => t._id);
  if (ids.length > 0) {
    await Task.deleteMany({ _id: { $in: ids } });
  }
};

/**
 * Daily cleanup: deletes past undone JourFix instances and tops up
 * future instances for every series. No-op if already run today.
 */
export const runJourFixCleanup = async (userId: string): Promise<void> => {
  await dbConnect();

  const user = await User.findById(userId);
  if (!user) return;

  const today = startOfDay(new Date());

  if (user.lastJourFixCleanup) {
    const last = startOfDay(new Date(user.lastJourFixCleanup));
    if (last >= today) return;
  }

  // 1. Delete past, undone JourFix instances. Past done ones stay in history.
  const allRecurring = await Task.find({
    userId,
    isRecurring: true,
    isDone: false,
  });
  const idsToDelete = allRecurring
    .filter((t) => {
      const d = parseDateString(t.date);
      return d !== null && d < today;
    })
    .map((t) => t._id);
  if (idsToDelete.length > 0) {
    await Task.deleteMany({ _id: { $in: idsToDelete } });
  }

  // 2. Top up each active series.
  const allSeries = await Series.find({ userId });
  for (const series of allSeries) {
    await ensureFutureInstances(series, today);
  }

  // 3. Mark cleanup done for today.
  user.lastJourFixCleanup = today;
  await user.save();
};

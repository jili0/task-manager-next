import Task from "@/models/Task";
import { getDateSortValue } from "@/lib/utils";

const HISTORY_MAX_AGE_YEARS = 1;

const toSortValue = (d: Date): number =>
  d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

export const pruneOldHistory = async (userId: string): Promise<number> => {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - HISTORY_MAX_AGE_YEARS);
  const cutoffValue = toSortValue(cutoff);

  const done = await Task.find({ userId, isDone: true })
    .select({ date: 1, updatedAt: 1 })
    .lean();

  const expired = done
    .filter((t) => {
      const byDate = getDateSortValue(t.date);
      if (byDate !== Number.MAX_SAFE_INTEGER) return byDate < cutoffValue;
      return t.updatedAt ? new Date(t.updatedAt) < cutoff : false;
    })
    .map((t) => t._id);

  if (expired.length === 0) return 0;
  const result = await Task.deleteMany({ _id: { $in: expired }, userId });
  return result.deletedCount;
};

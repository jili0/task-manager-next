import { ApiError } from "@/lib/api";
import Birthday from "@/models/Birthday";
import Task from "@/models/Task";
import {
  daysInMonth,
  isLeapYear,
  isValidDateString,
  isValidTimeString,
} from "@/lib/utils";
import { BirthdayFormData, IBirthday, ITask } from "@/types";
import { LIMITS, limitString } from "@/lib/limits";

export const DEFAULT_BIRTHDAY_TIME = "08:00";
export const BIRTHDAY_SUFFIX = "Geburtstag";

const pad2 = (n: number) => String(n).padStart(2, "0");

export const parseBirthday = (
  body: Record<string, unknown>
): BirthdayFormData => {
  const month = Number(body.month);
  const day = Number(body.day);
  const name = limitString(body.name, LIMITS.birthdayName, "Name").trim();

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new ApiError(400, "Invalid month");
  }
  if (!Number.isInteger(day) || day < 1 || day > daysInMonth(month)) {
    throw new ApiError(400, "Invalid day");
  }
  if (!name) throw new ApiError(400, "Name is required");

  const data: BirthdayFormData = { month, day, name: withBirthdaySuffix(name) };
  if (typeof body.time === "string" && body.time) {
    if (!isValidTimeString(body.time)) throw new ApiError(400, "Invalid time");
    data.time = body.time;
  }
  return data;
};

export const withBirthdaySuffix = (name: string): string =>
  name.toLowerCase().includes(BIRTHDAY_SUFFIX.toLowerCase())
    ? name
    : `${name} ${BIRTHDAY_SUFFIX}`;

export const birthdayDate = (day: number, month: number, year: number) => {
  const safeDay = month === 2 && day === 29 && !isLeapYear(year) ? 28 : day;
  return `${pad2(safeDay)}.${pad2(month)}.${year}`;
};

const isDuplicateKeyError = (e: unknown): boolean =>
  typeof e === "object" && e !== null && (e as { code?: number }).code === 11000;

export const ensureBirthdayTasks = async (userId: string): Promise<void> => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const birthdays = Birthday.collection;
  const tasks = Task.collection;

  const due = await birthdays
    .find({ userId, month, instanceYears: { $ne: year } })
    .toArray();

  for (const b of due) {
    const birthdayId = String(b._id);
    const exists = await tasks.findOne({ userId, birthdayId, birthdayYear: year });
    if (exists) {
      await birthdays.updateOne({ _id: b._id }, { $addToSet: { instanceYears: year } });
      continue;
    }
    const claimed = await birthdays.updateOne(
      { _id: b._id, userId, instanceYears: { $ne: year } },
      { $addToSet: { instanceYears: year } }
    );
    if (claimed.modifiedCount !== 1) continue;
    try {
      await tasks.insertOne({
        userId,
        birthdayId,
        birthdayYear: year,
        date: birthdayDate(b.day, month, year),
        time: b.time || DEFAULT_BIRTHDAY_TIME,
        text: b.name,
        isDone: false,
        createdAt: now,
        updatedAt: now,
        __v: 0,
      });
    } catch (e) {
      if (!isDuplicateKeyError(e)) throw e;
    }
  }
};

export const syncOpenBirthdayTasks = async (
  userId: string,
  birthday: IBirthday
): Promise<void> => {
  const open = await Task.find({
    userId,
    birthdayId: String(birthday._id),
    isDone: false,
  });
  for (const task of open) {
    task.date = birthdayDate(birthday.day, birthday.month, task.birthdayYear as number);
    task.time = birthday.time || DEFAULT_BIRTHDAY_TIME;
    task.text = birthday.name;
    await task.save();
  }
};

export const syncBirthdayFromTask = async (
  userId: string,
  task: ITask
): Promise<void> => {
  if (!task.birthdayId) return;
  const update: Partial<BirthdayFormData> = {};
  if (isValidDateString(task.date)) {
    update.day = parseInt(task.date.substring(0, 2), 10);
    update.month = parseInt(task.date.substring(3, 5), 10);
  }
  if (isValidTimeString(task.time)) update.time = task.time;
  const name = task.text.trim();
  if (name) update.name = name;
  if (Object.keys(update).length === 0) return;
  await Birthday.updateOne({ _id: task.birthdayId, userId }, update);
};

export const deleteOpenBirthdayTasks = async (
  userId: string,
  birthdayId: string
): Promise<void> => {
  await Task.deleteMany({ userId, birthdayId, isDone: false });
};

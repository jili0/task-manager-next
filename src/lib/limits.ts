import { ApiError } from "@/lib/api";

export const LIMITS = {
  date: 10,
  time: 5,
  text: 5000,
  name: 100,
  birthdayName: 200,
  email: 254,
  password: 200,
  minPassword: 5,
  maxPassword: 30,
} as const;

export const limitString = (
  value: unknown,
  max: number,
  field: string
): string => {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") throw new ApiError(400, `Invalid ${field}`);
  if (value.length > max) {
    throw new ApiError(400, `${field} is too long (max ${max} characters)`);
  }
  return value;
};

// src/types/index.ts
import { Session } from "next-auth";

// Extend the Session type to include user ID
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export interface ITask {
  _id?: string;
  date: string;
  time: string;
  text: string;
  isDone: boolean;
  isRecurring?: boolean;
  seriesId?: string;
  userId?: string;
  updatedAt?: Date;
}

export type TaskFormData = Omit<
  ITask,
  "_id" | "isDone" | "isRecurring" | "seriesId" | "userId" | "createdAt" | "updatedAt"
>;

export interface ISeries {
  _id?: string;
  userId: string;
  weekday: number; // 0=Sunday … 6=Saturday (matches Date.getDay())
  time: string;
  text: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SeriesFormData {
  weekday: number;
  time: string;
  text: string;
}

export interface IDraft {
  _id?: string;
  userId: string;
  mode: "add" | "edit";
  taskId?: string; // Only for edit mode
  date: string;
  time: string;
  text: string;
  updatedAt?: Date;
}

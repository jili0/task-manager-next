declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  interface User {
    id: string;
    remember?: boolean;
    sessionVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    remember?: boolean;
    sessionVersion?: number;
    loginAt?: number;
    checkedAt?: number;
  }
}

export interface ITask {
  _id?: string;
  date: string;
  time: string;
  text: string;
  isDone: boolean;
  birthdayId?: string;
  birthdayYear?: number;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TaskFormData = Pick<ITask, "date" | "time" | "text">;

export interface SearchState {
  date: string;
  time: string;
  text: string;
}

export interface IBirthday {
  _id?: string;
  userId: string;
  month: number;
  day: number;
  name: string;
  time?: string;
  instanceYears?: number[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BirthdayFormData {
  month: number;
  day: number;
  name: string;
  time?: string;
}

export interface IDraft {
  _id?: string;
  userId: string;
  mode: "add" | "edit";
  taskId?: string;
  date: string;
  time: string;
  text: string;
  updatedAt?: Date;
}

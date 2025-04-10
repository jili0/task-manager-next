// src/types/index.ts
import { Session } from 'next-auth';

// Extend the Session type to include user ID
declare module 'next-auth' {
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
  userId?: string; 
  updatedAt?: Date;
}

export type TaskFormData = Omit<ITask, '_id' | 'isDone' | 'userId' | 'createdAt' | 'updatedAt'>;
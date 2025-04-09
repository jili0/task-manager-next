export interface ITask {
  _id?: string;
  date: string;
  time: string;
  text: string;
  isDone: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TaskFormData = Omit<ITask, '_id' | 'isDone' | 'createdAt' | 'updatedAt'>;
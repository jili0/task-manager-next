import mongoose, { Schema } from 'mongoose';
import { ITask } from '@/types';

const TaskSchema = new Schema<ITask>(
  {
    date: {
      type: String,
      required: false,
    },
    time: {
      type: String,
      required: false,
    },
    text: {
      type: String,
      required: false,
    },
    isDone: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
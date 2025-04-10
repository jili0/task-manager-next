// src/models/Task.ts
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
    userId: {
      type: String,
      required: true,
      index: true
    }
  },
  {
    timestamps: true,
    // This will make it work with both new tasks and existing tasks
    validateBeforeSave: false
  }
);

// Create model only if it doesn't already exist
const Task = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

export default Task;
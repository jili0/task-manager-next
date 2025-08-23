import mongoose, { Schema } from 'mongoose';
import { IDraft } from '@/types';

const DraftSchema = new Schema<IDraft>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    mode: {
      type: String,
      enum: ["add", "edit"],
      required: true
    },
    taskId: {
      type: String,
      required: false
    },
    date: {
      type: String,
      required: false,
      default: ""
    },
    time: {
      type: String,
      required: false,
      default: ""
    },
    text: {
      type: String,
      required: false,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

// Compound index for unique drafts
DraftSchema.index({ userId: 1, mode: 1, taskId: 1 }, { unique: true });

const Draft = mongoose.models.Draft || mongoose.model<IDraft>('Draft', DraftSchema);

export default Draft;
import mongoose, { Schema } from "mongoose";
import { IDraft } from "@/types";

const DraftSchema = new Schema<IDraft>(
  {
    userId: { type: String, required: true, index: true },
    mode: { type: String, enum: ["add", "edit"], required: true },
    taskId: { type: String },
    date: { type: String, default: "" },
    time: { type: String, default: "" },
    text: { type: String, default: "" },
  },
  { timestamps: true }
);

DraftSchema.index({ userId: 1, mode: 1, taskId: 1 }, { unique: true });

if (mongoose.models.Draft) mongoose.deleteModel("Draft");
const Draft = mongoose.model<IDraft>("Draft", DraftSchema);

export default Draft;

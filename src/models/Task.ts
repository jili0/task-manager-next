import mongoose, { Schema } from "mongoose";
import { ITask } from "@/types";

const TaskSchema = new Schema<ITask>(
  {
    date: { type: String, default: "" },
    time: { type: String, default: "" },
    text: { type: String, default: "" },
    isDone: { type: Boolean, default: false, index: true },
    userId: { type: String, required: true, index: true },
    birthdayId: { type: String },
    birthdayYear: { type: Number },
  },
  { timestamps: true }
);

TaskSchema.index(
  { userId: 1, birthdayId: 1, birthdayYear: 1 },
  { unique: true, partialFilterExpression: { birthdayId: { $type: "string" } } }
);

if (mongoose.models.Task) mongoose.deleteModel("Task");
const Task = mongoose.model<ITask>("Task", TaskSchema);

export default Task;

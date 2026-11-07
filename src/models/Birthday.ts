import mongoose, { Schema } from "mongoose";
import { IBirthday } from "@/types";

const BirthdaySchema = new Schema<IBirthday>(
  {
    userId: { type: String, required: true, index: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    day: { type: Number, required: true, min: 1, max: 31 },
    name: { type: String, required: true },
    time: { type: String, default: "08:00" },
    instanceYears: { type: [Number], default: [] },
  },
  { timestamps: true }
);

if (mongoose.models.Birthday) mongoose.deleteModel("Birthday");
const Birthday = mongoose.model<IBirthday>("Birthday", BirthdaySchema);

export default Birthday;

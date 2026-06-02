// src/models/Series.ts
import mongoose, { Schema } from "mongoose";
import { ISeries } from "@/types";

const SeriesSchema = new Schema<ISeries>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    weekday: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    time: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Series =
  mongoose.models.Series || mongoose.model<ISeries>("Series", SeriesSchema);

export default Series;

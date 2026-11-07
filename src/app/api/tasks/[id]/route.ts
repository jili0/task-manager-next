import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import Draft from "@/models/Draft";
import {
  errorResponse,
  readJson,
  requireObjectId,
  requireUserId,
} from "@/lib/api";
import { ITask } from "@/types";
import { syncBirthdayFromTask } from "@/lib/birthday";
import { pruneOldHistory } from "@/lib/history";
import { LIMITS, limitString } from "@/lib/limits";

type Params = { params: Promise<{ id: string }> };

export const PUT = async (request: Request, { params }: Params) => {
  try {
    const id = requireObjectId((await params).id);
    const userId = await requireUserId();
    const body = await readJson<Partial<ITask>>(request);
    await dbConnect();

    const update: Partial<ITask> = {};
    if (typeof body.date === "string") {
      update.date = limitString(body.date, LIMITS.date, "Date");
    }
    if (typeof body.time === "string") {
      update.time = limitString(body.time, LIMITS.time, "Time");
    }
    if (typeof body.text === "string") {
      update.text = limitString(body.text, LIMITS.text, "Text");
    }
    if (typeof body.isDone === "boolean") update.isDone = body.isDone;

    const task = await Task.findOneAndUpdate({ _id: id, userId }, update, {
      new: true,
      runValidators: true,
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (task.birthdayId) await syncBirthdayFromTask(userId, task);
    if (update.isDone === true) await pruneOldHistory(userId);
    return NextResponse.json(task);
  } catch (error) {
    return errorResponse(error, "Could not save task");
  }
};

export const PATCH = async (request: Request, { params }: Params) => {
  try {
    const id = requireObjectId((await params).id);
    const userId = await requireUserId();
    const body = (await request.json().catch(() => ({}))) as { isDone?: boolean };
    await dbConnect();

    const task = await Task.findOne({ _id: id, userId });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    task.isDone = typeof body.isDone === "boolean" ? body.isDone : !task.isDone;
    await task.save();
    if (task.isDone) await pruneOldHistory(userId);
    return NextResponse.json(task);
  } catch (error) {
    return errorResponse(error, "Could not change task status");
  }
};

export const DELETE = async (_request: Request, { params }: Params) => {
  try {
    const id = requireObjectId((await params).id);
    const userId = await requireUserId();
    await dbConnect();

    const task = await Task.findOneAndDelete({ _id: id, userId });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    await Draft.deleteMany({ userId, mode: "edit", taskId: id });
    return NextResponse.json({ message: "Task deleted" });
  } catch (error) {
    return errorResponse(error, "Could not delete task");
  }
};

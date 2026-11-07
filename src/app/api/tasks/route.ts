import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import { errorResponse, readJson, requireUserId } from "@/lib/api";
import { TaskFormData } from "@/types";
import { ensureBirthdayTasks } from "@/lib/birthday";
import { LIMITS, limitString } from "@/lib/limits";

export const GET = async (request: Request) => {
  try {
    const userId = await requireUserId();
    const done = new URL(request.url).searchParams.get("done");
    await dbConnect();

    const filter: Record<string, unknown> = { userId };
    if (done === "true") filter.isDone = true;
    if (done === "false") filter.isDone = false;
    if (done !== "true") await ensureBirthdayTasks(userId);

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(tasks);
  } catch (error) {
    return errorResponse(error, "Could not load tasks");
  }
};

export const POST = async (request: Request) => {
  try {
    const userId = await requireUserId();
    const body = await readJson<Partial<TaskFormData>>(request);
    await dbConnect();

    const task = await Task.create({
      date: limitString(body.date, LIMITS.date, "Date"),
      time: limitString(body.time, LIMITS.time, "Time"),
      text: limitString(body.text, LIMITS.text, "Text"),
      isDone: false,
      userId,
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Could not create task");
  }
};

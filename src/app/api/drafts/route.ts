import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Draft from "@/models/Draft";
import { ApiError, errorResponse, readJson, requireUserId } from "@/lib/api";
import { IDraft } from "@/types";
import { LIMITS, limitString } from "@/lib/limits";

type DraftQuery = {
  userId: string;
  mode: "add" | "edit";
  taskId: string | null;
};

const draftQuery = (
  userId: string,
  mode: string | null,
  taskId: string | null | undefined
): DraftQuery => {
  if (mode !== "add" && mode !== "edit") {
    throw new ApiError(400, "Invalid draft mode");
  }
  if (mode === "edit" && !taskId) {
    throw new ApiError(400, "Task ID is required");
  }
  return { userId, mode, taskId: mode === "edit" ? (taskId as string) : null };
};

export const GET = async (request: Request) => {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const query = draftQuery(
      userId,
      searchParams.get("mode"),
      searchParams.get("taskId")
    );
    await dbConnect();
    const draft = await Draft.findOne(query);
    return NextResponse.json(draft);
  } catch (error) {
    return errorResponse(error, "Could not load draft");
  }
};

export const POST = async (request: Request) => {
  try {
    const userId = await requireUserId();
    const body = await readJson<Partial<IDraft>>(request);
    const query = draftQuery(userId, body.mode ?? null, body.taskId);
    await dbConnect();

    const draft = await Draft.findOneAndUpdate(
      query,
      {
        ...query,
        date: limitString(body.date, LIMITS.date, "Date"),
        time: limitString(body.time, LIMITS.time, "Time"),
        text: limitString(body.text, LIMITS.text, "Text"),
      },
      { upsert: true, new: true }
    );
    return NextResponse.json(draft);
  } catch (error) {
    return errorResponse(error, "Could not save draft");
  }
};

export const DELETE = async (request: Request) => {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const query = draftQuery(
      userId,
      searchParams.get("mode"),
      searchParams.get("taskId")
    );
    await dbConnect();
    await Draft.findOneAndDelete(query);
    return NextResponse.json({ message: "Draft deleted" });
  } catch (error) {
    return errorResponse(error, "Could not delete draft");
  }
};

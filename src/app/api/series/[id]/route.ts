// src/app/api/series/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import Series from "@/models/Series";
import { authOptions } from "@/lib/auth";
import {
  deleteFutureUndoneInstances,
  ensureFutureInstances,
  startOfDay,
} from "@/lib/jourfix";

const getUserId = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Not authenticated");
  return (session.user as any).id;
};

const errorResponse = (error: unknown, fallback: string) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  if (message === "Not authenticated") {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  console.error(fallback, error);
  return NextResponse.json(
    { error: fallback, details: message },
    { status: 500 }
  );
};

export const PUT = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const userId = await getUserId();
    const body = await request.json();
    await dbConnect();

    const series = await Series.findOneAndUpdate(
      { _id: id, userId },
      { weekday: body.weekday, time: body.time, text: body.text },
      { new: true, runValidators: true }
    );
    if (!series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }

    // Regenerate future instances so they reflect new weekday/time/text.
    // Past and already-done instances are preserved.
    const today = startOfDay(new Date());
    await deleteFutureUndoneInstances(id, userId, today);
    await ensureFutureInstances(series, today);

    return NextResponse.json(series);
  } catch (error) {
    return errorResponse(error, "Error updating series");
  }
};

export const DELETE = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const userId = await getUserId();
    await dbConnect();

    const series = await Series.findOneAndDelete({ _id: id, userId });
    if (!series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }
    await deleteFutureUndoneInstances(id, userId, startOfDay(new Date()));

    return NextResponse.json({ message: "Series deleted" });
  } catch (error) {
    return errorResponse(error, "Error deleting series");
  }
};

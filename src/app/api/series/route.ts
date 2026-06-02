// src/app/api/series/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import Series from "@/models/Series";
import { authOptions } from "@/lib/auth";
import { ensureFutureInstances, startOfDay } from "@/lib/jourfix";

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

export const GET = async () => {
  try {
    const userId = await getUserId();
    await dbConnect();
    const list = await Series.find({ userId }).sort({ weekday: 1, time: 1 });
    return NextResponse.json(list);
  } catch (error) {
    return errorResponse(error, "Error retrieving series");
  }
};

export const POST = async (request: Request) => {
  try {
    const userId = await getUserId();
    const body = await request.json();
    await dbConnect();

    const series = await Series.create({
      userId,
      weekday: body.weekday,
      time: body.time || "",
      text: body.text || "",
    });
    await ensureFutureInstances(series, startOfDay(new Date()));

    return NextResponse.json(series, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Error creating series");
  }
};

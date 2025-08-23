import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import Draft from "@/models/Draft";
import { authOptions } from "@/lib/auth";

// Helper to get the current user's ID from session
const getUserId = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
  return (session.user as any).id;
};

export const GET = async (request: Request) => {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    const taskId = searchParams.get("taskId");

    await dbConnect();

    const query: any = { userId, mode };
    if (mode === "edit" && taskId) {
      query.taskId = taskId;
    }

    const draft = await Draft.findOne(query);
    return NextResponse.json(draft);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    if (errorMessage === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Error retrieving draft", details: errorMessage },
      { status: 500 }
    );
  }
};

export const POST = async (request: Request) => {
  try {
    const userId = await getUserId();
    const body = await request.json();

    await dbConnect();

    const draftData = {
      userId,
      mode: body.mode,
      taskId: body.taskId || null,
      date: body.date || "",
      time: body.time || "",
      text: body.text || "",
    };

    const query: any = { userId, mode: body.mode };
    if (body.mode === "edit" && body.taskId) {
      query.taskId = body.taskId;
    }

    const draft = await Draft.findOneAndUpdate(query, draftData, {
      upsert: true,
      new: true,
    });

    return NextResponse.json(draft);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    if (errorMessage === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Error saving draft", details: errorMessage },
      { status: 500 }
    );
  }
};

export const DELETE = async (request: Request) => {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    const taskId = searchParams.get("taskId");

    await dbConnect();

    const query: any = { userId, mode };
    if (mode === "edit" && taskId) {
      query.taskId = taskId;
    }

    await Draft.findOneAndDelete(query);
    return NextResponse.json({ message: "Draft deleted" });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    if (errorMessage === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Error deleting draft", details: errorMessage },
      { status: 500 }
    );
  }
};

// src/app/api/jourfix/cleanup/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import { sortTasks } from "@/lib/utils";
import { authOptions } from "@/lib/auth";
import { runJourFixCleanup } from "@/lib/jourfix";

const getUserId = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Not authenticated");
  if (!(session.user as any).id) {
    throw new Error("User ID not found in session");
  }
  return (session.user as any).id;
};

export const POST = async () => {
  try {
    const userId = await getUserId();
    await dbConnect();
    const changed = await runJourFixCleanup(userId);
    if (!changed) {
      return NextResponse.json({ changed: false });
    }
    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json({ changed: true, tasks: sortTasks(tasks) });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";

    console.error("JourFix cleanup error:", error);

    if (message === "Not authenticated") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Cleanup failed", details: message },
      { status: 500 }
    );
  }
};

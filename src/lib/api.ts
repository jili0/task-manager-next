import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const requireUserId = async (): Promise<string> => {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) throw new ApiError(401, "Not signed in");
  return id;
};

export const requireObjectId = (id: string): string => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid ID");
  return id;
};

export const readJson = async <T = Record<string, unknown>>(
  request: Request
): Promise<T> => {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, "Invalid request");
  }
};

export const errorResponse = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Error && error.name === "CastError") {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
};

import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Birthday from "@/models/Birthday";
import { errorResponse, readJson, requireUserId } from "@/lib/api";
import { parseBirthday } from "@/lib/birthday";

export const GET = async () => {
  try {
    const userId = await requireUserId();
    await dbConnect();
    const list = await Birthday.find({ userId }).sort({ month: 1, day: 1 });
    return NextResponse.json(list);
  } catch (error) {
    return errorResponse(error, "Could not load birthdays");
  }
};

export const POST = async (request: Request) => {
  try {
    const userId = await requireUserId();
    const data = parseBirthday(await readJson(request));
    await dbConnect();
    const birthday = await Birthday.create({ userId, ...data });
    return NextResponse.json(birthday, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Could not create birthday");
  }
};

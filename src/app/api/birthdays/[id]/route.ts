import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Birthday from "@/models/Birthday";
import {
  errorResponse,
  readJson,
  requireObjectId,
  requireUserId,
} from "@/lib/api";
import {
  deleteOpenBirthdayTasks,
  parseBirthday,
  syncOpenBirthdayTasks,
} from "@/lib/birthday";

type Params = { params: Promise<{ id: string }> };

export const PUT = async (request: Request, { params }: Params) => {
  try {
    const id = requireObjectId((await params).id);
    const userId = await requireUserId();
    const data = parseBirthday(await readJson(request));
    await dbConnect();

    const birthday = await Birthday.findOneAndUpdate({ _id: id, userId }, data, {
      new: true,
      runValidators: true,
    });
    if (!birthday) {
      return NextResponse.json({ error: "Birthday not found" }, { status: 404 });
    }
    await syncOpenBirthdayTasks(userId, birthday);
    return NextResponse.json(birthday);
  } catch (error) {
    return errorResponse(error, "Could not save birthday");
  }
};

export const DELETE = async (_request: Request, { params }: Params) => {
  try {
    const id = requireObjectId((await params).id);
    const userId = await requireUserId();
    await dbConnect();

    const birthday = await Birthday.findOneAndDelete({ _id: id, userId });
    if (!birthday) {
      return NextResponse.json({ error: "Birthday not found" }, { status: 404 });
    }
    await deleteOpenBirthdayTasks(userId, id);
    return NextResponse.json({ message: "Birthday deleted" });
  } catch (error) {
    return errorResponse(error, "Could not delete birthday");
  }
};

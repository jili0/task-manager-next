import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { ApiError, errorResponse, requireUserId } from "@/lib/api";

export const DELETE = async () => {
  try {
    const userId = await requireUserId();
    await dbConnect();
    const user = await User.findByIdAndUpdate(userId, {
      $inc: { sessionVersion: 1 },
    });
    if (!user) throw new ApiError(401, "Not signed in");
    return NextResponse.json({ message: "Signed out on all devices" });
  } catch (error) {
    return errorResponse(error, "Could not sign out other devices");
  }
};

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { ApiError, errorResponse, readJson, requireUserId } from "@/lib/api";
import { LIMITS, limitString } from "@/lib/limits";
import {
  ACCOUNT_MAX_PER_USER,
  ACCOUNT_WINDOW_MS,
  allowRequest,
} from "@/lib/rateLimit";

export const POST = async (request: Request) => {
  try {
    const userId = await requireUserId();
    if (!allowRequest(`account:${userId}`, ACCOUNT_MAX_PER_USER, ACCOUNT_WINDOW_MS)) {
      throw new ApiError(429, "Too many attempts. Please try again later.");
    }
    const body = await readJson(request);
    const currentPassword = limitString(
      body.currentPassword,
      LIMITS.password,
      "Password"
    );
    const newPassword = limitString(
      body.newPassword,
      LIMITS.maxPassword,
      "Password"
    );

    if (!currentPassword || !newPassword) {
      throw new ApiError(400, "Please fill out all fields");
    }
    if (newPassword.length < LIMITS.minPassword) {
      throw new ApiError(
        400,
        `Password must be at least ${LIMITS.minPassword} characters`
      );
    }

    await dbConnect();
    const user = await User.findById(userId);
    if (!user) throw new ApiError(401, "Not signed in");
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      throw new ApiError(400, "Current password is incorrect");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    await user.save();

    return NextResponse.json({ message: "Password changed" });
  } catch (error) {
    return errorResponse(error, "Could not change password");
  }
};

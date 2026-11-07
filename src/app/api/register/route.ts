import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { ApiError, errorResponse, readJson } from "@/lib/api";
import { normalizeEmail } from "@/lib/auth";
import { LIMITS, limitString } from "@/lib/limits";
import {
  REGISTER_MAX_PER_IP,
  REGISTER_WINDOW_MS,
  allowRequest,
  clientIp,
} from "@/lib/rateLimit";

const MIN_PASSWORD_LENGTH = LIMITS.minPassword;

export const POST = async (request: Request) => {
  try {
    const ip = clientIp(request.headers);
    if (!allowRequest(`register:${ip}`, REGISTER_MAX_PER_IP, REGISTER_WINDOW_MS)) {
      throw new ApiError(429, "Too many registrations. Please try again later.");
    }
    const body = await readJson(request);

    const name = limitString(body.name, LIMITS.name, "Name").trim();
    const email = normalizeEmail(limitString(body.email, LIMITS.email, "Email"));
    const password = limitString(body.password, LIMITS.maxPassword, "Password");

    if (!name || !email || !password) {
      throw new ApiError(400, "Please fill out all fields");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, "Invalid email address");
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new ApiError(
        400,
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      );
    }

    await dbConnect();
    if (await User.exists({ email })) {
      throw new ApiError(400, "This email address is already in use");
    }

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
    });

    return NextResponse.json(
      { id: user._id, name: user.name, email: user.email },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error, "Registration failed");
  }
};

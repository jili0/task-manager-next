// src/app/api/register/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export const POST = async (request: Request) => {
  try {
    const { name, email, password } = await request.json();
    
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'All fields must be filled out' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'This email address is already in use' },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });
    
    // Remove sensitive data and send response
    const result = {
      id: user._id,
      name: user.name,
      email: user.email,
    };
    
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';
    
    return NextResponse.json(
      { error: 'Registration failed', details: errorMessage },
      { status: 500 }
    );
  }
};
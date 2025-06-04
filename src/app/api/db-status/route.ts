import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';

export async function GET() {
  try {
    const conn = await dbConnect();
    return NextResponse.json({ 
      status: 'connected', 
      readyState: conn.connection.readyState
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';
    
    return NextResponse.json({ 
      status: 'error', 
      message: errorMessage 
    }, { status: 500 });
  }
}
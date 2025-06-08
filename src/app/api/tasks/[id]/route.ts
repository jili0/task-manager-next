// src/app/api/tasks/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import { authOptions } from '@/lib/auth';

// Helper to get the current user's ID from session
const getUserId = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error('Not authenticated');
  }
  return (session.user as any).id;
};

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params; // Await params
    const userId = await getUserId();
    await dbConnect();
    
    // Only allow access to the user's own tasks
    const task = await Task.findOne({ _id: id, userId });
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    return NextResponse.json(task);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';
    
    console.error('GET task error:', error);
    
    if (errorMessage === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Error retrieving task',
      details: errorMessage 
    }, { status: 500 });
  }
};

export const PUT = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params; // Await params
    const userId = await getUserId();
    const body = await request.json();
    await dbConnect();
    
    // Only allow updates to the user's own tasks
    const task = await Task.findOneAndUpdate(
      { _id: id, userId },
      {
        date: body.date,
        time: body.time,
        text: body.text,
        isDone: body.isDone,
      },
      { new: true, runValidators: true }
    );
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    return NextResponse.json(task);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';
    
    console.error('PUT task error:', error);
    
    if (errorMessage === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Error updating task',
      details: errorMessage 
    }, { status: 500 });
  }
};

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params; // Await params
    const userId = await getUserId();
    await dbConnect();
    
    // Only allow toggling of the user's own tasks
    const task = await Task.findOne({ _id: id, userId });
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    task.isDone = !task.isDone;
    await task.save();
    
    return NextResponse.json(task);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';
    
    console.error('PATCH task error:', error);
    
    if (errorMessage === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Error toggling task status',
      details: errorMessage 
    }, { status: 500 });
  }
};

export const DELETE = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params; // Await params
    const userId = await getUserId();
    await dbConnect();
    
    // Only allow deletion of the user's own tasks
    const task = await Task.findOneAndDelete({ _id: id, userId });
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Task deleted' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';
    
    console.error('DELETE task error:', error);
    
    if (errorMessage === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Error deleting task',
      details: errorMessage 
    }, { status: 500 });
  }
};
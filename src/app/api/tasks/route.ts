// src/app/api/tasks/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import { sortTasks } from '@/lib/utils';
import { authOptions } from '@/lib/auth';

// Helper to get the current user's ID from session
const getUserId = async () => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error('Not authenticated');
  }
  
  // Make sure we have the id on the user object
  if (!(session.user as any).id) {
    throw new Error('User ID not found in session');
  }
  
  return (session.user as any).id;
};

export const GET = async () => {
  try {
    const userId = await getUserId();
    await dbConnect();
    
    // Only get tasks for the current user
    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json(sortTasks(tasks));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';
    
    console.error('GET tasks error:', error);
    
    if (errorMessage === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Error retrieving tasks',
      details: errorMessage 
    }, { status: 500 });
  }
};

export const POST = async (request: Request) => {
  try {
    // Get the user ID first
    const userId = await getUserId();
    
    // Then connect to the database
    await dbConnect();
    
    // Parse the request body
    const body = await request.json();
    
    // Create the task with the userId included
    const taskData = {
      date: body.date || '',
      time: body.time || '',
      text: body.text || '',
      isDone: false,
      userId: userId  // Explicitly add the userId here
    };
    
    console.log('Creating task with data:', taskData);
    
    // Create the task
    const task = await Task.create(taskData);
    
    return NextResponse.json(task, { status: 201 });
  } catch (error: unknown) {
    // Get detailed error information
    console.error('Error creating task:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';
    
    // Handle different error types
    if (errorMessage === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    if (errorMessage === 'User ID not found in session') {
      return NextResponse.json({ 
        error: 'Error creating task', 
        details: 'Invalid user session' 
      }, { status: 500 });
    }
    
    // If it's a MongoDB validation error
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ 
        error: 'Error creating task', 
        details: error.message 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Error creating task',
      details: errorMessage 
    }, { status: 500 });
  }
};

export const DELETE = async () => {
  try {
    const userId = await getUserId();
    await dbConnect();
    
    // Only delete tasks for the current user
    await Task.deleteMany({ userId });
    return NextResponse.json({ message: 'All tasks deleted' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';
    
    console.error('DELETE tasks error:', error);
    
    if (errorMessage === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Error deleting tasks',
      details: errorMessage 
    }, { status: 500 });
  }
};
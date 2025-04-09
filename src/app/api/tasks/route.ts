import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import { sortTasks } from '@/lib/utils';

export async function GET() {
  try {
    await dbConnect();
    const tasks = await Task.find({}).sort({ createdAt: -1 });
    return NextResponse.json(sortTasks(tasks));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Ein unbekannter Fehler ist aufgetreten';
    
    return NextResponse.json({ 
      error: 'Fehler beim Abrufen der Aufgaben',
      details: errorMessage 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await dbConnect();
    
    const task = await Task.create({
      date: body.date || '',
      time: body.time || '',
      text: body.text || '',
      isDone: false,
    });
    
    return NextResponse.json(task, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Ein unbekannter Fehler ist aufgetreten';
    
    return NextResponse.json({ 
      error: 'Fehler beim Erstellen der Aufgabe',
      details: errorMessage 
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await dbConnect();
    await Task.deleteMany({});
    return NextResponse.json({ message: 'Alle Aufgaben gelöscht' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Ein unbekannter Fehler ist aufgetreten';
    
    return NextResponse.json({ 
      error: 'Fehler beim Löschen der Aufgaben',
      details: errorMessage 
    }, { status: 500 });
  }
}
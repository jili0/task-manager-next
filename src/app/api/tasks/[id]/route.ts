import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const task = await Task.findById(params.id);
    
    if (!task) {
      return NextResponse.json({ error: 'Aufgabe nicht gefunden' }, { status: 404 });
    }
    
    return NextResponse.json(task);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Ein unbekannter Fehler ist aufgetreten';
    
    return NextResponse.json({ 
      error: 'Fehler beim Abrufen der Aufgabe',
      details: errorMessage 
    }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    await dbConnect();
    
    const task = await Task.findByIdAndUpdate(
      params.id,
      {
        date: body.date,
        time: body.time,
        text: body.text,
        isDone: body.isDone,
      },
      { new: true, runValidators: true }
    );
    
    if (!task) {
      return NextResponse.json({ error: 'Aufgabe nicht gefunden' }, { status: 404 });
    }
    
    return NextResponse.json(task);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Ein unbekannter Fehler ist aufgetreten';
    
    return NextResponse.json({ 
      error: 'Fehler beim Aktualisieren der Aufgabe',
      details: errorMessage 
    }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const task = await Task.findById(params.id);
    
    if (!task) {
      return NextResponse.json({ error: 'Aufgabe nicht gefunden' }, { status: 404 });
    }
    
    task.isDone = !task.isDone;
    await task.save();
    
    return NextResponse.json(task);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Ein unbekannter Fehler ist aufgetreten';
    
    return NextResponse.json({ 
      error: 'Fehler beim Umschalten des Status',
      details: errorMessage 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const task = await Task.findByIdAndDelete(params.id);
    
    if (!task) {
      return NextResponse.json({ error: 'Aufgabe nicht gefunden' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Aufgabe gelöscht' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Ein unbekannter Fehler ist aufgetreten';
    
    return NextResponse.json({ 
      error: 'Fehler beim Löschen der Aufgabe',
      details: errorMessage 
    }, { status: 500 });
  }
}
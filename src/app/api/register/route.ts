import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Alle Felder müssen ausgefüllt sein' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Prüfen, ob der Benutzer bereits existiert
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Diese E-Mail-Adresse wird bereits verwendet' },
        { status: 400 }
      );
    }
    
    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Neuen Benutzer erstellen
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });
    
    // Persönliche Daten entfernen und Antwort senden
    const result = {
      id: user._id,
      name: user.name,
      email: user.email,
    };
    
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Ein unbekannter Fehler ist aufgetreten';
    
    return NextResponse.json(
      { error: 'Registrierung fehlgeschlagen', details: errorMessage },
      { status: 500 }
    );
  }
}
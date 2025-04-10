# Next.js Task Manager

A full-stack task management application built with Next.js, MongoDB, and NextAuth.js.

## Features

- **User Authentication**: Secure login and registration system
- **Personal Task Management**: Each user can only view and manage their own tasks
- **Task Operations**: Create, read, update, and delete tasks
- **Smart Date/Time Input**: Quick shortcuts for entering dates and times
- **Task Sorting**: Automatically organizes tasks by date and time
- **Task Status**: Mark tasks as complete/incomplete
- **Print View**: Print your task list with a clean, optimized layout

## Tech Stack

- **Frontend**: Next.js, React, CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Language**: TypeScript

### Date & Time Shortcuts

- **Date Input**:
  - Enter `DD` for the current month (e.g., `04` for the 4th) and press Enter
  - Enter `DDMM` for the current year (e.g., `0405` for May 4th) and press Enter
  - Enter `DDMMYY` for a specific date (e.g., `040523` for May 4th, 2023)

- **Time Input**:
  - Enter `HH` for full hours (e.g., `09` becomes `09:00`) and press Enter
  - Enter `HHMM` for specific time (e.g., `0930` becomes `09:30`)

## Project Structure

```
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js app router
│   │   ├── api/            # API routes
│   │   ├── login/          # Login page
│   │   ├── register/       # Registration page
│   │   ├── page.tsx        # Home page (Task Dashboard)
│   │   └── ...
│   ├── components/         # React components
│   │   ├── Header.tsx
│   │   ├── TaskInput.tsx
│   │   ├── TaskItem.tsx
│   │   └── TaskList.tsx
│   ├── lib/                # Utilities
│   │   ├── auth.ts         # Auth configuration
│   │   ├── db.ts           # Database connection
│   │   └── utils.ts        # Helper functions
│   ├── models/             # MongoDB schemas
│   │   ├── Task.ts
│   │   └── User.ts
│   ├── styles/             # CSS styles
│   └── types/              # TypeScript definitions
├── .env.local              # Environment variables (create this)
├── next.config.js          # Next.js configuration
└── package.json            # Project dependencies
```

## Database Schema

### User Model
```typescript
{
  name: String,
  email: String,
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Task Model
```typescript
{
  date: String,
  time: String,
  text: String,
  isDone: Boolean,
  userId: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Authentication

The application uses NextAuth.js with a JWT strategy and credentials provider for authentication. Each user can only access their own tasks, providing a secure multi-user environment.

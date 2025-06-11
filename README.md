# Next.js Task Manager

A full-stack task management application built with Next.js and MongoDB.

## Features

- **User Authentication**: Secure login and registration system
- **Task Operations**: Create, read, update, and delete tasks
- **Smart Date/Time Input**: Quick shortcuts for entering dates and times
- **Task Sorting**: Automatically organizes tasks by date and time
- **Print View**: Print your task list with a clean, optimized layout
- **History View**: View your task that are marked as done


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


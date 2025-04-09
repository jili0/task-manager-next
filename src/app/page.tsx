'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import TaskList from '@/components/TaskList';
import { ITask } from '@/types';
import { sortTasks } from '@/lib/utils';
import '@/styles/styles.css';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Leite zur Login-Seite weiter, wenn nicht authentifiziert
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Lade Aufgaben vom Server beim ersten Rendern
  useEffect(() => {
    // Lade Aufgaben nur, wenn der Benutzer authentifiziert ist
    if (status === 'authenticated') {
      const fetchTasks = async () => {
        try {
          const response = await fetch('/api/tasks');
          if (response.ok) {
            const data = await response.json();
            setTasks(data);
          }
        } catch (error) {
          console.error('Fehler beim Laden der Aufgaben:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchTasks();
    }
  }, [status]);

  // Füge eine neue Aufgabe hinzu
  const addTask = async (newTask: any) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(prevTasks => sortTasks([...prevTasks, data]));
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Aufgabe:', error);
    }
  };

  // Aktualisiere eine bestehende Aufgabe
  const updateTask = async (updatedTask: ITask) => {
    try {
      const response = await fetch(`/api/tasks/${updatedTask._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTask),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(prevTasks => 
          sortTasks(prevTasks.map(task => task._id === data._id ? data : task))
        );
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Aufgabe:', error);
    }
  };

  // Lösche eine Aufgabe
  const deleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Aufgabe:', error);
    }
  };

  // Umschalten des Erledigtstatus einer Aufgabe
  const toggleTaskDone = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(prevTasks => 
          prevTasks.map(task => task._id === data._id ? data : task)
        );
      }
    } catch (error) {
      console.error('Fehler beim Umschalten des Status:', error);
    }
  };

  // Lösche alle Aufgaben
  const clearTasks = async () => {
    if (window.confirm('Sind Sie sicher, dass Sie alle Aufgaben löschen möchten?')) {
      try {
        const response = await fetch('/api/tasks', {
          method: 'DELETE',
        });

        if (response.ok) {
          setTasks([]);
        }
      } catch (error) {
        console.error('Fehler beim Löschen aller Aufgaben:', error);
      }
    }
  };

  // Einfache Druckfunktion
  const printTasks = () => {
    window.print();
  };

  // Zeige Ladeanzeige, wenn Status wird geladen oder nicht authentifiziert ist
  if (status === 'loading' || status === 'unauthenticated') {
    return <div className="loading">Lade...</div>;
  }

  if (loading) {
    return <div className="loading">Lade Aufgaben...</div>;
  }

  return (
    <div className="app-container">
      <Header 
        title="Task Manager" 
        onClear={clearTasks}
        onPrint={printTasks}
        userName={session?.user?.name || ''}
      />
      <div className="container">
        <TaskList 
          tasks={tasks}
          onAddTask={addTask}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
          onToggleTaskDone={toggleTaskDone}
        />
      </div>
    </div>
  );
}
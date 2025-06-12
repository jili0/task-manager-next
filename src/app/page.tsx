// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import TaskList from '@/components/TaskList';
import { ITask } from '@/types';
import { sortTasks } from '@/lib/utils';
import '@/styles/styles.css';

const Home = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login page if not authenticated
  useEffect(() => {
    if (status === 'loading') {
      return;
    }
    
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Load tasks from server when authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const fetchTasks = async () => {
        try {
          setError(null);
          const response = await fetch('/api/tasks');
          
          if (response.ok) {
            const data = await response.json();
            setTasks(data);
          } else if (response.status === 401) {
            router.push('/login');
          } else {
            const errorData = await response.json();
            setError(errorData.error || 'Failed to load tasks');
          }
        } catch (error) {
          setError('Error connecting to the server');
          console.error('Error loading tasks:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchTasks();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status, session, router]);

  // API functions
  const taskApi = {
    addTask: async (newTask: any) => {
      try {
        setError(null);
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
        } else if (response.status === 401) {
          router.push('/login');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to add task');
        }
      } catch (error) {
        setError('Error connecting to the server');
        console.error('Error adding task:', error);
      }
    },

    updateTask: async (updatedTask: ITask) => {
      try {
        setError(null);
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
        } else if (response.status === 401) {
          router.push('/login');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to update task');
        }
      } catch (error) {
        setError('Error connecting to the server');
        console.error('Error updating task:', error);
      }
    },

    deleteTask: async (taskId: string) => {
      try {
        setError(null);
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
        } else if (response.status === 401) {
          router.push('/login');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to delete task');
        }
      } catch (error) {
        setError('Error connecting to the server');
        console.error('Error deleting task:', error);
      }
    },

    toggleTaskDone: async (taskId: string) => {
      try {
        setError(null);
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
        });

        if (response.ok) {
          const data = await response.json();
          setTasks(prevTasks => 
            prevTasks.map(task => task._id === data._id ? data : task)
          );
        } else if (response.status === 401) {
          router.push('/login');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to toggle task status');
        }
      } catch (error) {
        setError('Error connecting to the server');
        console.error('Error toggling task status:', error);
      }
    },
  };

  const printTasks = () => {
    window.print();
  };

  const headerButtons = [
    { label: "Print", onClick: printTasks },
    { label: "History", onClick: () => router.push('/history') }
  ];

  if (status === 'loading') {
    return <div className="loading">Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

  return (
    <div className="app-container">
      <Header 
        title="Task Manager" 
        buttons={headerButtons}
        userName={session?.user?.name || ''}
      />
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      <div className="container">
        <TaskList 
          tasks={tasks}
          mode="main"
          onAddTask={taskApi.addTask}
          onUpdateTask={taskApi.updateTask}
          onDeleteTask={taskApi.deleteTask}
          onToggleTaskDone={taskApi.toggleTaskDone}
        />
      </div>
    </div>
  );
};

export default Home;
// src/components/TaskList.tsx
import React, { useState } from 'react';
import TaskItem from './TaskItem';
import InputRow from './InputRow';
import { ITask } from '@/types';

interface TaskListProps {
  tasks: ITask[];
  onAddTask: (task: Omit<ITask, '_id' | 'isDone' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTask: (task: ITask) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskDone: (taskId: string) => void;
}

const TaskList = ({ 
  tasks, 
  onAddTask, 
  onUpdateTask, 
  onDeleteTask, 
  onToggleTaskDone 
}: TaskListProps) => {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const handleEditTask = (taskId: string) => {
    setEditingTaskId(taskId);
  };

  const handleSaveTask = (updatedTask: ITask) => {
    onUpdateTask(updatedTask);
    setEditingTaskId(null);
  };

  // Filter out completed tasks
  const activeTasks = tasks.filter(task => !task.isDone);

  return (
    <div className="task-list">
      <InputRow 
        mode="add"
        onAddTask={onAddTask} 
      />
      {activeTasks.map((task, index) => (
        <TaskItem
          key={task._id}
          task={task}
          index={index}
          isEditing={task._id === editingTaskId}
          onEdit={() => handleEditTask(task._id as string)}
          onSave={handleSaveTask}
          onToggleDone={() => onToggleTaskDone(task._id as string)}
        />
      ))}
    </div>
  );
};

export default TaskList;
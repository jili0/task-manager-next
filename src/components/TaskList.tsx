import React, { useState } from 'react';
import TaskItem from './TaskItem';
import TaskInput from './TaskInput';
import { ITask } from '@/types';

interface TaskListProps {
  tasks: ITask[];
  onAddTask: (task: Omit<ITask, '_id' | 'isDone' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTask: (task: ITask) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskDone: (taskId: string) => void;
}

function TaskList({ 
  tasks, 
  onAddTask, 
  onUpdateTask, 
  onDeleteTask, 
  onToggleTaskDone 
}: TaskListProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const handleEditTask = (taskId: string) => {
    setEditingTaskId(taskId);
  };

  const handleSaveTask = (updatedTask: ITask) => {
    onUpdateTask(updatedTask);
    setEditingTaskId(null);
  };

  return (
    <div className="task-list">
      {tasks.map((task, index) => (
        <TaskItem
          key={task._id}
          task={task}
          index={index}
          isEditing={task._id === editingTaskId}
          onEdit={() => handleEditTask(task._id as string)}
          onSave={handleSaveTask}
          onDelete={() => onDeleteTask(task._id as string)}
          onToggleDone={() => onToggleTaskDone(task._id as string)}
        />
      ))}
      <TaskInput onAddTask={onAddTask} />
    </div>
  );
}

export default TaskList;
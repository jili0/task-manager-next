// src/components/TaskItem.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ITask } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';

interface TaskItemProps {
  task: ITask;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (task: ITask) => void;
  onDelete: () => void;
  onToggleDone: () => void;
}

const TaskItem = ({ 
  task, 
  index, 
  isEditing, 
  onEdit, 
  onSave, 
  onDelete, 
  onToggleDone 
}: TaskItemProps) => {
  const [editedTask, setEditedTask] = useState<ITask>({
    ...task,
    date: task.date || '',
    time: task.time || '',
    text: task.text || ''
  });
  
  const timeInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditedTask({
      ...task,
      date: task.date || '',
      time: task.time || '',
      text: task.text || ''
    });
  }, [task]);

  // Auto-resize textarea
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
    }
  }, [editedTask.text]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for date formatting
    if (name === 'date') {
      // Handle raw date inputs
      if (value.match(/^\d{1,5}$/)) {
        setEditedTask(prev => ({
          ...prev,
          date: value
        }));
        return;
      }
      
      // Handle complete date (e.g., "040525")
      else if (value.match(/^\d{6}$/)) {
        const formattedDate = formatDate(value);
        
        // Save directly with formatted date
        onSave({
          ...task,
          ...editedTask,
          date: formattedDate
        });
        
        return;
      }
    }
    
    // Special handling for time formatting
    if (name === 'time') {
      // Store raw hour value
      if (value.match(/^\d{1,3}$/)) {
        setEditedTask(prev => ({
          ...prev,
          time: value
        }));
        return;
      }
      
      // Handle hours and minutes (e.g., "0800")
      if (value.match(/^\d{4}$/)) {
        const formattedTime = formatTime(value);
        
        setEditedTask(prev => ({
          ...prev,
          time: formattedTime
        }));
        return;
      }
    }
    
    setEditedTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      // Special handling for date field - move focus to time field
      if (e.currentTarget.name === 'date') {
        e.preventDefault();
        
        // Format date if it matches patterns
        if (editedTask.date && (editedTask.date.match(/^\d{2}$/) || editedTask.date.match(/^\d{4}$/))) {
          const formattedDate = formatDate(editedTask.date);
          
          // Update formatted date in state
          setEditedTask(prev => ({
            ...prev,
            date: formattedDate
          }));
        }
        
        // Move focus to time field
        if (timeInputRef.current) {
          timeInputRef.current.focus();
        }
        return;
      }
      
      // Special handling for time field - move focus to text field
      if (e.currentTarget.name === 'time') {
        e.preventDefault();
        
        // Format time if it matches 2-digit pattern
        if (editedTask.time && editedTask.time.match(/^\d{2}$/)) {
          const formattedTime = `${editedTask.time}:00`;
          
          // Update time in state
          setEditedTask(prev => ({
            ...prev,
            time: formattedTime
          }));
        }
        
        // Move focus to text field
        if (textAreaRef.current) {
          textAreaRef.current.focus();
        }
        return;
      }
      
      // For textarea, Enter creates new line (normal behavior)
      if (e.currentTarget.name === 'text') {
        // Allow normal Enter for new lines
        return;
      }
    }
    
    // Escape key saves the task
    if (e.key === 'Escape') {
      saveTask();
    }
  };

  const saveTask = () => {
    // Only save task if there's any content
    if (editedTask.date || editedTask.time || editedTask.text) {
      onSave({
        ...task,
        ...editedTask
      });
    }
  };

  if (isEditing) {
    return (
      <div className={`task-item ${index % 2 === 0 ? '' : 'even'}`}>
        <div className="task-item-date">
          <input
            type="text"
            name="date"
            value={editedTask.date}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Date"
            autoFocus
          />
        </div>
        <div className="task-item-time">
          <input
            type="text"
            name="time"
            value={editedTask.time}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Time"
            ref={timeInputRef}
          />
        </div>
        <div className="task-item-text">
          <textarea
            name="text"
            value={editedTask.text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Task"
            ref={textAreaRef}
            className="task-edit-textarea"
          />
        </div>
        <div className="task-item-actions">
          <button 
            onClick={saveTask}
            className="btn btn-save"
          >
            Save
          </button>
          <button 
            onClick={() => onSave(task)}
            className="btn btn-cancel"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`task-item ${task.isDone ? 'done' : ''}`}
      onClick={onEdit}
    >
      <div className="task-item-date">
        {task.date || ' '}
      </div>
      <div className="task-item-time">
        {task.time || ' '}
      </div>
      <div className="task-item-text">
        {task.text ? task.text.split('\n').map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < task.text.split('\n').length - 1 && <br />}
          </React.Fragment>
        )) : ' '}
      </div>
      <div className="task-item-actions">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleDone();
          }}
          className={`btn btn-done ${task.isDone ? 'text-green-600' : ''}`}
        >
          ✓
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="btn btn-delete"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default TaskItem;
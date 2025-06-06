// src/components/TaskInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import { TaskFormData } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';

interface TaskInputProps {
  onAddTask: (task: TaskFormData) => void;
}

const TaskInput = ({ onAddTask }: TaskInputProps) => {
  const [newTask, setNewTask] = useState<TaskFormData>({
    date: '',
    time: '',
    text: ''
  });
  const timeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea function
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  // Adjust height when text changes
  useEffect(() => {
    if (textAreaRef.current) {
      adjustTextareaHeight(textAreaRef.current);
    }
  }, [newTask.text]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Auto-resize on change
    adjustTextareaHeight(e.target);
    
    // Special handling for date formatting
    if (name === 'date') {
      // Store raw value for day or day-month
      if (value.match(/^\d{1,5}$/)) {
        setNewTask(prev => ({
          ...prev,
          date: value
        }));
        return;
      }
      
      // Handle complete date (e.g., "040525")
      else if (value.match(/^\d{6}$/)) {
        const formattedDate = formatDate(value);
        
        // Add task directly with formatted date
        onAddTask({
          ...newTask,
          date: formattedDate
        });
        
        // Reset input fields after adding
        setNewTask({
          date: '',
          time: '',
          text: ''
        });
        
        return;
      }
    }
    
    // Special handling for time formatting
    if (name === 'time') {
      // Store raw value for hours
      if (value.match(/^\d{1,3}$/)) {
        setNewTask(prev => ({
          ...prev,
          time: value
        }));
        return;
      }
      
      // Handle hours and minutes (e.g., "0800")
      if (value.match(/^\d{4}$/)) {
        const formattedTime = formatTime(value);
        
        setNewTask(prev => ({
          ...prev,
          time: formattedTime
        }));
        return;
      }
    }
    
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      // Special handling for date field
      if (e.currentTarget.name === 'date') {
        e.preventDefault();
        
        // Format date if it matches patterns
        if (newTask.date && (newTask.date.match(/^\d{2}$/) || newTask.date.match(/^\d{4}$/))) {
          const formattedDate = formatDate(newTask.date);
          
          // Update formatted date in state
          setNewTask(prev => ({
            ...prev,
            date: formattedDate
          }));
        }
        
        // Move focus to time field
        if (timeTextareaRef.current) {
          timeTextareaRef.current.focus();
        }
        return;
      }
      
      // Special handling for time field
      if (e.currentTarget.name === 'time') {
        e.preventDefault();
        
        // Format time if it matches 2-digit pattern
        if (newTask.time && newTask.time.match(/^\d{2}$/)) {
          const formattedTime = `${newTask.time}:00`;
          
          // Update time in state
          setNewTask(prev => ({
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
      
      // For text area, allow Enter for new lines, but Ctrl+Enter adds task
      if (e.currentTarget.name === 'text' && e.ctrlKey) {
        e.preventDefault();
        handleAddTask();
      }
    }
  };

  const handleAddTask = () => {
    // Only add task if there's any content
    if (newTask.date || newTask.time || newTask.text) {
      onAddTask(newTask);
      // Reset input fields after adding
      setNewTask({
        date: '',
        time: '',
        text: ''
      });
    }
  };

  return (
    <div className="task-input">
      <div className="task-input-date">
        <textarea
          name="date"
          value={newTask.date}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Date"
          rows={1}
          className="task-input-field"
        />
      </div>
      <div className="task-input-time">
        <textarea
          name="time"
          value={newTask.time}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Time"
          ref={timeTextareaRef}
          rows={1}
          className="task-input-field"
        />
      </div>
      <div className="task-input-text">
        <textarea
          name="text"
          value={newTask.text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Task"
          ref={textAreaRef}
          rows={1}
          className="task-input-textarea"
        />
      </div>
      <div className="task-input-actions">
        <button 
          onClick={handleAddTask}
          className="btn btn-add"
          title="Add Task"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TaskInput;
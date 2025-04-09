import React, { useState, useEffect, useRef } from 'react';
import { ITask } from '@/types';

interface TaskItemProps {
  task: ITask;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (task: ITask) => void;
  onDelete: () => void;
  onToggleDone: () => void;
}

function TaskItem({ 
  task, 
  index, 
  isEditing, 
  onEdit, 
  onSave, 
  onDelete, 
  onToggleDone 
}: TaskItemProps) {
  const [editedTask, setEditedTask] = useState<ITask>({
    ...task,
    date: task.date || '',
    time: task.time || '',
    text: task.text || ''
  });
  const timeInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedTask({
      ...task,
      date: task.date || '',
      time: task.time || '',
      text: task.text || ''
    });
  }, [task]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Spezielle Behandlung für Datumsformatierung
    if (name === 'date') {
      const today = new Date();
      const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
      const currentYear = today.getFullYear();
      
      // Speichere den Rohwert für Tag oder Tag-Monat
      if (value.match(/^\d{1,5}$/)) {
        setEditedTask(prev => ({
          ...prev,
          date: value
        }));
        return;
      }
      
      // Behandle vollständiges Datum (z.B., "040525")
      else if (value.match(/^\d{6}$/)) {
        const day = value.substring(0, 2);
        const month = value.substring(2, 4);
        const year = 2000 + parseInt(value.substring(4, 6));
        
        const date = new Date(`${year}-${month}-${day}`);
        const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
        const weekday = days[date.getDay()];
        
        const formattedDate = `${weekday}, ${day}.${month}.${year}`;
        
        // Direkt mit formatiertem Datum speichern
        onSave({
          ...task,
          ...editedTask,
          date: formattedDate
        });
        
        return;
      }
    }
    
    // Spezielle Behandlung für Zeitformatierung
    if (name === 'time') {
      // Speichere Rohwert für Stunden
      if (value.match(/^\d{1,3}$/)) {
        setEditedTask(prev => ({
          ...prev,
          time: value
        }));
        return;
      }
      
      // Behandle Stunden und Minuten (z.B., "0800")
      if (value.match(/^\d{4}$/)) {
        const hours = value.substring(0, 2);
        const minutes = value.substring(2, 4);
        
        setEditedTask(prev => ({
          ...prev,
          time: `${hours}:${minutes}`
        }));
        return;
      }
    }
    
    setEditedTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Spezielle Behandlung für Datumsfeld - Fokus auf Zeitfeld verschieben
      if (e.currentTarget.name === 'date') {
        e.preventDefault(); // Standardaktion Enter verhindern
        
        // Formatiere Datum, wenn es den Mustern entspricht
        if (editedTask.date && (editedTask.date.match(/^\d{2}$/) || editedTask.date.match(/^\d{4}$/))) {
          const today = new Date();
          const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
          const currentYear = today.getFullYear();
          
          let day, month, formattedDate;
          
          if (editedTask.date.match(/^\d{2}$/)) {
            // Formatiere nur Tag (z.B., "04")
            day = editedTask.date;
            month = currentMonth;
            
            const date = new Date(`${currentYear}-${month}-${day}`);
            const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
            const weekday = days[date.getDay()];
            
            formattedDate = `${weekday}, ${day}.${month}.${currentYear}`;
          } else {
            // Formatiere Tag und Monat (z.B., "0405")
            day = editedTask.date.substring(0, 2);
            month = editedTask.date.substring(2, 4);
            
            const date = new Date(`${currentYear}-${month}-${day}`);
            const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
            const weekday = days[date.getDay()];
            
            formattedDate = `${weekday}, ${day}.${month}.${currentYear}`;
          }
          
          // Formatiertes Datum im State aktualisieren
          setEditedTask(prev => ({
            ...prev,
            date: formattedDate
          }));
        }
        
        // Fokus auf Zeitfeld verschieben
        if (timeInputRef.current) {
          timeInputRef.current.focus();
        }
        return;
      }
      
      // Spezielle Behandlung für Zeitfeld - Fokus auf Textfeld verschieben
      if (e.currentTarget.name === 'time') {
        e.preventDefault(); // Standardaktion Enter verhindern
        
        // Formatiere Zeit, wenn es dem 2-stelligen Muster entspricht
        if (editedTask.time && editedTask.time.match(/^\d{2}$/)) {
          const hours = editedTask.time;
          const formattedTime = `${hours}:00`;
          
          // Zeit im State aktualisieren
          setEditedTask(prev => ({
            ...prev,
            time: formattedTime
          }));
        }
        
        // Fokus auf Textfeld verschieben
        if (textInputRef.current) {
          textInputRef.current.focus();
        }
        return;
      }
      
      // Aufgabe bei Enter im Textfeld speichern
      saveTask();
    }
  };

  const saveTask = () => {
    // Aufgabe nur speichern, wenn es irgendwelchen Inhalt gibt
    if (editedTask.date || editedTask.time || editedTask.text) {
      onSave({
        ...task,
        ...editedTask
      });
    }
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    return dateStr;
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
          <input
            type="text"
            name="text"
            value={editedTask.text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Task"
            ref={textInputRef}
          />
        </div>
        <div className="task-item-actions">
          <button 
            onClick={saveTask}
            className="btn btn-save"
          >
            Speichern
          </button>
          <button 
            onClick={() => onSave(task)}
            className="btn btn-cancel"
          >
            Abbrechen
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
        {formatDate(task.date) || ' '}
      </div>
      <div className="task-item-time">
        {task.time || ' '}
      </div>
      <div className="task-item-text">
        {task.text || ' '}
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
}

export default TaskItem;
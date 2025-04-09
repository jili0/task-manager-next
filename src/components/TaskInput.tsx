import React, { useState, useRef } from 'react';
import { TaskFormData } from '@/types';

interface TaskInputProps {
  onAddTask: (task: TaskFormData) => void;
}

function TaskInput({ onAddTask }: TaskInputProps) {
  const [newTask, setNewTask] = useState<TaskFormData>({
    date: '',
    time: '',
    text: ''
  });
  const timeInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Spezielle Behandlung für Datumsformatierung
    if (name === 'date') {
      const today = new Date();
      const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
      const currentYear = today.getFullYear();
      
      // Speichere den Rohwert für Tag oder Tag-Monat
      if (value.match(/^\d{1,5}$/)) {
        setNewTask(prev => ({
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
        
        // Aufgabe direkt mit formatiertem Datum hinzufügen
        onAddTask({
          ...newTask,
          date: formattedDate
        });
        
        // Eingabefelder nach dem Hinzufügen zurücksetzen
        setNewTask({
          date: '',
          time: '',
          text: ''
        });
        
        return;
      }
    }
    
    // Spezielle Behandlung für Zeitformatierung
    if (name === 'time') {
      // Speichere Rohwert für Stunden
      if (value.match(/^\d{1,3}$/)) {
        setNewTask(prev => ({
          ...prev,
          time: value
        }));
        return;
      }
      
      // Behandle Stunden und Minuten (z.B., "0800")
      if (value.match(/^\d{4}$/)) {
        const hours = value.substring(0, 2);
        const minutes = value.substring(2, 4);
        
        setNewTask(prev => ({
          ...prev,
          time: `${hours}:${minutes}`
        }));
        return;
      }
    }
    
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Spezielle Behandlung für Datumsfeld
      if (e.currentTarget.name === 'date') {
        e.preventDefault();
        
        // Formatiere Datum, wenn es den Mustern entspricht
        if (newTask.date && (newTask.date.match(/^\d{2}$/) || newTask.date.match(/^\d{4}$/))) {
          const today = new Date();
          const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
          const currentYear = today.getFullYear();
          
          let day, month, formattedDate;
          
          if (newTask.date.match(/^\d{2}$/)) {
            // Formatiere nur Tag (z.B., "04")
            day = newTask.date;
            month = currentMonth;
            
            const date = new Date(`${currentYear}-${month}-${day}`);
            const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
            const weekday = days[date.getDay()];
            
            formattedDate = `${weekday}, ${day}.${month}.${currentYear}`;
          } else {
            // Formatiere Tag und Monat (z.B., "0405")
            day = newTask.date.substring(0, 2);
            month = newTask.date.substring(2, 4);
            
            const date = new Date(`${currentYear}-${month}-${day}`);
            const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
            const weekday = days[date.getDay()];
            
            formattedDate = `${weekday}, ${day}.${month}.${currentYear}`;
          }
          
          // Formatiertes Datum im State aktualisieren
          setNewTask(prev => ({
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
      
      // Spezielle Behandlung für Zeitfeld
      if (e.currentTarget.name === 'time') {
        e.preventDefault();
        
        // Formatiere Zeit, wenn es dem 2-stelligen Muster entspricht
        if (newTask.time && newTask.time.match(/^\d{2}$/)) {
          const hours = newTask.time;
          const formattedTime = `${hours}:00`;
          
          // Zeit im State aktualisieren
          setNewTask(prev => ({
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
      
      // Aufgabe hinzufügen, wenn Enter im Textfeld gedrückt wird
      handleAddTask();
    }
  };

  const handleAddTask = () => {
    // Aufgabe nur hinzufügen, wenn es irgendwelchen Inhalt gibt
    if (newTask.date || newTask.time || newTask.text) {
      onAddTask(newTask);
      // Eingabefelder nach dem Hinzufügen zurücksetzen
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
        <input
          type="text"
          name="date"
          value={newTask.date}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Date"
        />
      </div>
      <div className="task-input-time">
        <input
          type="text"
          name="time"
          value={newTask.time}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Time"
          ref={timeInputRef}
        />
      </div>
      <div className="task-input-text">
        <input
          type="text"
          name="text"
          value={newTask.text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Task"
          ref={textInputRef}
        />
      </div>
      <div className="task-input-actions">
        <button 
          onClick={handleAddTask}
          className="btn btn-add"
        >
          Hinzufügen
        </button>
      </div>
    </div>
  );
}

export default TaskInput;
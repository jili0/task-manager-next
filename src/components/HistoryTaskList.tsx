import React, { useState } from 'react';
import HistoryTaskItem from './HistoryTaskItem';
import SearchRow, { SearchState } from './SearchRow';
import { ITask } from '@/types';

interface HistoryTaskListProps {
  tasks: ITask[];
  onDeleteTask: (taskId: string) => void;
}

const HistoryTaskList = ({ 
  tasks, 
  onDeleteTask 
}: HistoryTaskListProps) => {
  const [searchTerms, setSearchTerms] = useState<SearchState>({
    date: '',
    time: '',
    text: ''
  });

  const handleSearchChange = (field: keyof SearchState, value: string) => {
    setSearchTerms(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Filter tasks based on search terms
  const filteredTasks = tasks.filter(task => {
    return (
      (!searchTerms.date || task.date.toLowerCase().includes(searchTerms.date.toLowerCase())) &&
      (!searchTerms.time || task.time.toLowerCase().includes(searchTerms.time.toLowerCase())) &&
      (!searchTerms.text || task.text.toLowerCase().includes(searchTerms.text.toLowerCase()))
    );
  });

  return (
    <div className="task-list">
      <SearchRow 
        searchTerms={searchTerms}
        onSearchChange={handleSearchChange}
      />
      {filteredTasks.map((task, index) => (
        <HistoryTaskItem
          key={task._id}
          task={task}
          index={index}
          onDelete={() => onDeleteTask(task._id as string)}
          searchTerms={searchTerms}
        />
      ))}
    </div>
  );
};

export default HistoryTaskList;
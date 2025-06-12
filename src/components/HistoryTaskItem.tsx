import React from 'react';
import { ITask } from '@/types';
import { SearchState } from './SearchRow';

interface HistoryTaskItemProps {
  task: ITask;
  index: number;
  onDelete: () => void;
  onUndo: () => void;
  searchTerms: SearchState;
}

const HistoryTaskItem = ({ 
  task, 
  index, 
  onDelete,
  onUndo,
  searchTerms 
}: HistoryTaskItemProps) => {

  // Function to highlight search terms
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
  };

  return (
    <div className={`task-item ${index % 2 === 0 ? '' : 'even'}`}>
      <div className="task-item-date">
        {highlightText(task.date || '', searchTerms.date)}
      </div>
      <div className="task-item-time">
        {highlightText(task.time || '', searchTerms.time)}
      </div>
      <div className="task-item-text">
        {task.text ? task.text.split('\n').map((line, i) => (
          <React.Fragment key={i}>
            {highlightText(line, searchTerms.text)}
            {i < task.text.split('\n').length - 1 && <br />}
          </React.Fragment>
        )) : ' '}
      </div>
      <div className="task-item-actions">
        <button 
          onClick={onUndo}
          className="btn btn-secondary"
          title="Restore task"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4v6h6"></path>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
        </button>
        <button 
          onClick={onDelete}
          className="btn btn-danger"
          title="Delete permanently"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3,6 5,6 21,6"></polyline>
            <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default HistoryTaskItem;
import React from 'react';

export interface SearchState {
  date: string;
  time: string;
  text: string;
}

interface SearchRowProps {
  searchTerms: SearchState;
  onSearchChange: (field: keyof SearchState, value: string) => void;
}

const SearchRow = ({ searchTerms, onSearchChange }: SearchRowProps) => {
  return (
    <div className="task-item search-row">
      <div className="task-item-date">
        <input
          type="text"
          placeholder="Search date..."
          value={searchTerms.date}
          onChange={(e) => onSearchChange('date', e.target.value)}
        />
      </div>
      <div className="task-item-time">
        <input
          type="text"
          placeholder="Search time..."
          value={searchTerms.time}
          onChange={(e) => onSearchChange('time', e.target.value)}
        />
      </div>
      <div className="task-item-text">
        <input
          type="text"
          placeholder="Search task..."
          value={searchTerms.text}
          onChange={(e) => onSearchChange('text', e.target.value)}
        />
      </div>
      <div className="task-item-actions">
        {/* Empty column for alignment */}
      </div>
    </div>
  );
};

export default SearchRow;
import React from 'react';

interface HeaderProps {
  title: string;
  onClear: () => void;
  onPrint: () => void;
}

function Header({ title, onClear, onPrint }: HeaderProps) {
  return (
    <header className="header">
      <div className="container header-content">
        <h1 className="header-title">{title}</h1>
        <div className="header-buttons">
          <button 
            onClick={onPrint}
            className="btn btn-print"
            title="Aufgaben drucken"
          >
            Drucken
          </button>
          <button 
            onClick={onClear}
            className="btn btn-clear"
            title="Alle Aufgaben löschen"
          >
            Löschen
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
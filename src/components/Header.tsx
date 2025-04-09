import React from 'react';
import { signOut } from 'next-auth/react';

interface HeaderProps {
  title: string;
  onClear: () => void;
  onPrint: () => void;
  userName?: string;
}

function Header({ title, onClear, onPrint, userName }: HeaderProps) {
  return (
    <header className="header">
      <div className="container header-content">
        <div className="header-left">
          <h1 className="header-title">{title}</h1>
          <div className="header-main-buttons">
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
        <div className="header-right">
          {userName && <span className="user-name">Hallo, {userName}</span>}
          {userName && (
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="btn btn-logout"
              title="Abmelden"
            >
              Abmelden
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
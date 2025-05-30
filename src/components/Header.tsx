// src/components/Header.tsx
import React from 'react';
import { signOut } from 'next-auth/react';

interface HeaderProps {
  title: string;
  onClear: () => void;
  onPrint: () => void;
  userName?: string;
}

const Header = ({ title, onClear, onPrint, userName }: HeaderProps) => {
  return (
    <header className="header">
      <div className="container header-content">
        <div className="header-left">
          <h1 className="header-title">{title}</h1>
          <div className="header-main-buttons">
            <button 
              onClick={onPrint}
              className="btn btn-print"
            >
              Print
            </button>
            <button 
              onClick={onClear}
              className="btn btn-clear"
            >
              Delete
            </button>
          </div>
        </div>
        <div className="header-right">
          {userName && <span className="user-name">Hello, {userName}</span>}
          {userName && (
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="btn btn-logout"
              title="Sign Out"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
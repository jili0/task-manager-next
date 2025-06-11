// src/components/Header.tsx
import React from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title: string;
  onPrint: () => void;
  userName?: string;
}

const Header = ({ title, onPrint, userName }: HeaderProps) => {
  const router = useRouter();

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
              onClick={() => router.push('/history')}
              className="btn btn-history"
            >
              History
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
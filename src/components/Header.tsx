// src/components/Header.tsx
import React from "react";
import { signOut } from "next-auth/react";

interface HeaderButton {
  label: string;
  onClick: () => void;
  className?: string;
}

interface HeaderProps {
  title: string;
  buttons: HeaderButton[];
  userName?: string;
}

const Header = ({ title, buttons, userName }: HeaderProps) => {
  return (
    <header>
      <div className="container header-content">
        <div className="header-left">
          <h1 className="header-title">{title}<span>!</span></h1>
          {userName && <span className="user-name">Hello, {userName}</span>}
        </div>
        <div className="header-right">
          {buttons.map((button, index) => (
            <button
              key={index}
              onClick={button.onClick}
              className={button.className || "btn btn-header"}
            >
              {button.label}
            </button>
          ))}
          {userName && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="btn btn-header"
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

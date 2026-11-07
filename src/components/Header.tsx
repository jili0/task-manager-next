"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOutAndClear } from "@/lib/session";

export type HeaderPage = "home" | "birthdays" | "history" | "account";

interface HeaderProps {
  currentPage: HeaderPage;
  userName?: string;
}

const NAV: { id: HeaderPage; label: string; href: string }[] = [
  { id: "home", label: "Start", href: "/" },
  { id: "birthdays", label: "Birthdays", href: "/birthdays" },
  { id: "history", label: "History", href: "/history" },
  { id: "account", label: "Account", href: "/account" },
];

const Header = ({ currentPage, userName }: HeaderProps) => {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <header>
      <div className="container header-content">
        <div className="header-left">
          <h1 className="header-title">
            Tasks<span>!</span>
          </h1>
          {userName && (
            <span className="user-info">
              {!isOnline && <span className="offline-label">Offline</span>}
              <span className="user-name">Hello, {userName}</span>
              <button
                onClick={() => signOutAndClear(true)}
                className="btn btn-header"
                title="Sign Out"
              >
                Sign Out
              </button>
            </span>
          )}
        </div>
        <div className="header-right">
          {NAV.map((item) => {
            const isActive = item.id === currentPage;
            return (
              <button
                key={item.id}
                onClick={() => !isActive && router.push(item.href)}
                aria-current={isActive ? "page" : undefined}
                className={
                  "btn btn-header" + (isActive ? " btn-header-active" : "")
                }
              >
                {item.label}
              </button>
            );
          })}
          <button
            onClick={() => window.print()}
            className="btn btn-header"
            title="Print"
          >
            Print
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

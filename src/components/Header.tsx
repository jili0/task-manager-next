// src/components/Header.tsx
"use client";

import React, { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { clearAllTaskCaches } from "@/lib/taskCache";
import { clearAllQueues } from "@/lib/syncQueue";

export type HeaderPage = "home" | "jourfix" | "history";

interface HeaderProps {
  title: string;
  currentPage: HeaderPage;
  userName?: string;
}

const NAV: { id: HeaderPage; label: string; href: string }[] = [
  { id: "home", label: "Start", href: "/" },
  { id: "jourfix", label: "JourFix", href: "/jourfix" },
  { id: "history", label: "History", href: "/history" },
];

const handleSignOut = () => {
  // Clear the rememberMe flags so they do not leak into a subsequent login
  if (typeof window !== "undefined") {
    localStorage.removeItem("rememberMe");
    sessionStorage.removeItem("sessionActive");
    clearAllTaskCaches();
    clearAllQueues();
  }
  signOut({ callbackUrl: "/login" });
};

const Header = ({ title, currentPage, userName }: HeaderProps) => {
  const router = useRouter();
  // Default to online to avoid a hydration mismatch; the effect corrects it
  // on mount and keeps it in sync via the browser online/offline events.
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
          <h1 className="header-title">{title}<span>!</span></h1>
          {userName && (
            <span className="user-info">
              {!isOnline && (
                <span className="offline-label">Offline-Modus</span>
              )}
              <span className="user-name">Hello, {userName}</span>
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
          {userName && (
            <button
              onClick={handleSignOut}
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

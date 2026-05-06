'use client';

import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { useEffect } from 'react';

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated') return;

    const isPersistent = localStorage.getItem('rememberMe') === 'persistent';
    const isSessionActive = sessionStorage.getItem('sessionActive') === '1';

    // If neither flag is present, the browser was reopened after a session-only login → sign out
    if (!isPersistent && !isSessionActive) {
      signOut({ redirect: false });
    }
  }, [status]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionGuard>{children}</SessionGuard>
    </SessionProvider>
  );
}
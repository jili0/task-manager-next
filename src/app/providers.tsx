"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { isLoginStillValid, signOutAndClear } from "@/lib/session";

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!isLoginStillValid()) signOutAndClear(false);
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

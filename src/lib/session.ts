import { signOut } from "next-auth/react";
import { clearAllCaches } from "@/lib/localCache";
import { clearAllQueues } from "@/lib/syncQueue";

export const REMEMBER_KEY = "rememberMe";
export const SESSION_ACTIVE_KEY = "sessionActive";

export const clearLocalData = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(SESSION_ACTIVE_KEY);
  } catch {}
  clearAllCaches();
  clearAllQueues();
};

export const signOutAndClear = (redirect: boolean): Promise<unknown> => {
  clearLocalData();
  return redirect
    ? signOut({ callbackUrl: "/login" })
    : signOut({ redirect: false });
};

export const rememberLogin = (persistent: boolean): void => {
  try {
    if (persistent) {
      localStorage.setItem(REMEMBER_KEY, "persistent");
      sessionStorage.removeItem(SESSION_ACTIVE_KEY);
    } else {
      sessionStorage.setItem(SESSION_ACTIVE_KEY, "1");
      localStorage.removeItem(REMEMBER_KEY);
    }
  } catch {}
};

export const isLoginStillValid = (): boolean => {
  try {
    return (
      localStorage.getItem(REMEMBER_KEY) === "persistent" ||
      sessionStorage.getItem(SESSION_ACTIVE_KEY) === "1"
    );
  } catch {
    return true;
  }
};

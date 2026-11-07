"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { signOutAndClear } from "@/lib/session";

const MIN_PASSWORD_LENGTH = 5;
const MAX_PASSWORD_LENGTH = 30;
const CURRENT_PASSWORD_MAX_LENGTH = 200;

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {open ? (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.9 10.9 0 0 1 12 19c-6.5 0-10-7-10-7a19.8 19.8 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a19.8 19.8 0 0 1-3.17 4.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  minLength?: number;
  maxLength: number;
  invalid?: boolean;
  children?: React.ReactNode;
}

const PasswordField = ({
  id,
  label,
  value,
  onChange,
  autoComplete,
  minLength,
  maxLength,
  invalid,
  children,
}: PasswordFieldProps) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <div className="account-input">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={minLength}
          maxLength={maxLength}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          spellCheck={false}
        />
        <button
          type="button"
          className="btn account-eye"
          onClick={() => setVisible((v) => !v)}
          title={visible ? "Hide password" : "Show password"}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
      {children}
    </div>
  );
};

const Account = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"password" | "devices" | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const mismatch = repeatPassword.length > 0 && repeatPassword !== newPassword;

  const request = async (
    kind: "password" | "devices",
    init: RequestInit,
    url: string,
    fallback: string
  ) => {
    setError(null);
    setBusy(kind);
    try {
      const res = await fetch(url, init);
      if (res.status === 401) return router.push("/login");
      if (!res.ok) throw new Error((await res.json()).error || fallback);
      await signOutAndClear(true);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Could not reach the server."
          : err instanceof Error
            ? err.message
            : fallback
      );
      setBusy(null);
    }
  };

  const changePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (mismatch) {
      setError("The new passwords do not match.");
      return;
    }
    request(
      "password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      },
      "/api/account/password",
      "Could not change password"
    );
  };

  const signOutEverywhere = () => {
    if (!window.confirm("Sign out on all devices, including this one?")) return;
    request(
      "devices",
      { method: "DELETE" },
      "/api/account/sessions",
      "Could not sign out other devices"
    );
  };

  if (status !== "authenticated") return null;

  const name = session?.user?.name || "";
  const email = session?.user?.email || "";

  return (
    <div className="app-container">
      <Header currentPage="account" userName={name} />
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      <div className="container account">
        <div className="account-card account-profile">
          <div className="account-avatar" aria-hidden="true">
            {initials(name)}
          </div>
          <div className="account-identity">
            <h2>{name}</h2>
            <p>{email}</p>
          </div>
          <button
            type="button"
            onClick={signOutEverywhere}
            className="btn btn-danger account-btn"
            disabled={busy !== null}
          >
            {busy === "devices" ? "Signing out..." : "Sign out on all devices"}
          </button>
        </div>

        <form className="account-card account-form" onSubmit={changePassword}>
          <h2>Change password</h2>
          <button
            type="submit"
            className="btn btn-primary account-btn"
            disabled={busy !== null}
          >
            {busy === "password" ? "Saving..." : "Change password"}
          </button>
          <div className="account-fields">
            <PasswordField
              id="current-password"
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
              maxLength={CURRENT_PASSWORD_MAX_LENGTH}
            />
            <PasswordField
              id="new-password"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              maxLength={MAX_PASSWORD_LENGTH}
            />
            <PasswordField
              id="repeat-password"
              label="Repeat new password"
              value={repeatPassword}
              onChange={setRepeatPassword}
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              maxLength={MAX_PASSWORD_LENGTH}
              invalid={mismatch}
            >
              {mismatch && (
                <div className="account-mismatch">Passwords do not match</div>
              )}
            </PasswordField>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Account;

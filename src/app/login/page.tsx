"use client";

import { Suspense, useRef, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createCache } from "@/lib/localCache";
import { rememberLogin } from "@/lib/session";
import { ITask } from "@/types";

const tasksCache = createCache<ITask>("tasks");

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const emailValue = emailRef.current?.value || email;
    const passwordValue = passwordRef.current?.value || password;

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: emailValue,
        password: passwordValue,
        remember: rememberMe ? "true" : "false",
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      rememberLogin(rememberMe);

      try {
        const [session, tasksRes] = await Promise.all([
          getSession(),
          fetch("/api/tasks?done=false"),
        ]);
        const userId = session?.user?.id;
        if (userId && tasksRes.ok) {
          tasksCache.save(userId, (await tasksRes.json()) as ITask[]);
        }
      } catch {}

      router.push("/");
      router.refresh();
    } catch {
      setError("Sign in failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h1>Sign In</h1>
        {registered && !error && (
          <div className="success-message">
            Registration successful. Please sign in.
          </div>
        )}
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              ref={emailRef}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              ref={passwordRef}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="form-group form-group-inline">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember">Keep me signed in for 30 days</label>
          </div>
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="signup-link">
          Don&#39;t have an account? <Link href="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

const Login = () => (
  <Suspense fallback={<div className="loading">Loading...</div>}>
    <LoginForm />
  </Suspense>
);

export default Login;

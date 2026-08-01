"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import posthog from "posthog-js";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) throw new Error(result.error.message);
      // Identify returning user and capture login event
      if (result.data?.user?.id) {
        posthog.identify(result.data.user.id, { role: "user" });
      }
      posthog.capture("user_logged_in", { method: "email" });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    posthog.capture("user_logged_in", { method: "google" });
    await authClient.signIn.social({ provider: "google" });
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--paper-white)", padding: "var(--space-3)",
    }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-4)" }}>
          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2rem",
            letterSpacing: "-0.03em",
          }}>GENZPOCKET</h1>
          <p className="caption" style={{ marginTop: "0.25rem" }}>Your blunt, honest money friend 💸</p>
        </div>

        {/* Login Card */}
        <div className="ledger-card">
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.25rem", marginBottom: "var(--space-3)" }}>
            Log In
          </h2>

          <form onSubmit={handleLogin} className="stack stack-md">
            <div className="form-group">
              <label className="label" htmlFor="email">Email</label>
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="password">Password</label>
              <input
                id="login-password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "0.5rem" }}
              disabled={loading}
              id="btn-login-submit"
            >
              {loading ? "Logging in..." : "Log In →"}
            </button>
          </form>

          <div className="divider" style={{ marginTop: "var(--space-3)" }} />

          <button
            className="btn btn-secondary"
            style={{ width: "100%" }}
            onClick={handleGoogle}
            id="btn-google-login"
          >
            <span>G</span> Continue with Google
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: "var(--space-2)", fontFamily: "var(--font-display)", fontSize: "0.875rem" }}>
          No account?{" "}
          <Link href="/signup" style={{ color: "var(--electric-blue)", fontWeight: 700 }}>
            Sign up free →
          </Link>
        </p>
      </div>
    </div>
  );
}

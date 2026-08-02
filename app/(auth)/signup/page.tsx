"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import posthog from "posthog-js";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await authClient.signUp.email({ name, email, password });
      if (result.error) throw new Error(result.error.message);
      // Identify the newly registered user and capture the sign-up event
      if (result.data?.user?.id) {
        posthog.identify(result.data.user.id, { name, role: "user" });
      }
      posthog.capture("user_signed_up", { method: "email" });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--paper-white)", padding: "var(--space-3)",
    }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "var(--space-4)" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2rem", letterSpacing: "-0.03em" }}>
            GENZPOCKET
          </h1>
          <p className="caption">Track it. Budget it. Own it. 💪</p>
        </div>

        <div className="ledger-card">
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.25rem", marginBottom: "var(--space-3)" }}>
            Create Account
          </h2>

          <form onSubmit={handleSignup} className="stack stack-md">
            <div className="form-group">
              <label className="label" htmlFor="signup-name">Your Name</label>
              <input
                id="signup-name"
                type="text"
                className="input"
                placeholder="Riya, Arjun, Meera..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                type="email"
                className="input"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                className="input"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "0.5rem" }}
              disabled={loading}
              id="btn-signup-submit"
            >
              {loading ? "Creating account..." : "Get Started →"}
            </button>
          </form>

          <p className="caption" style={{ textAlign: "center", marginTop: "var(--space-2)" }}>
            By signing up you agree to our Privacy Policy. No hidden fees, ever.
          </p>

          <div className="divider" style={{ marginTop: "var(--space-3)", marginBottom: "var(--space-3)" }} />

          <button
            className="btn btn-secondary"
            style={{ width: "100%" }}
            onClick={async () => {
              posthog.capture("user_signed_up", { method: "google" });
              await authClient.signIn.social({ provider: "google" });
            }}
            id="btn-google-signup"
          >
            <span>G</span> Continue with Google
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: "var(--space-2)", fontFamily: "var(--font-display)", fontSize: "0.875rem" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--electric-blue)", fontWeight: 700 }}>
            Log in →
          </Link>
        </p>
      </div>
    </div>
  );
}

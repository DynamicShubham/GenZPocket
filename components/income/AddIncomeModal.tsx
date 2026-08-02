"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import posthog from "posthog-js";

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddIncomeModal({ onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !source) {
      setError("Amount and source are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/incomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          source,
        }),
      });
      if (!res.ok) throw new Error("Failed to log income");
      posthog.capture("income_logged", {
        source,
        amount_inr: parseFloat(amount),
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed", inset: 0, background: "rgba(13,13,13,0.55)",
          zIndex: 200, backdropFilter: "none",
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "var(--paper-white)",
          borderTop: "3px solid var(--ink-black)",
          borderRadius: "6px 6px 0 0",
          boxShadow: "0 -4px 0 var(--ink-black)",
          padding: "var(--space-3)",
          zIndex: 201,
          maxWidth: "480px",
          margin: "0 auto",
          animation: "slide-in-up 0.15s var(--ease-snap) forwards",
        }}
      >
        {/* Header */}
        <div className="row-between" style={{ marginBottom: "var(--space-3)" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.25rem" }}>
            Log Income
          </h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="stack stack-md">
          {/* Amount */}
          <div className="form-group">
            <label className="label" htmlFor="income-amount">Amount (₹)</label>
            <input
              id="income-amount"
              type="number"
              min="0"
              step="0.01"
              className="input"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.25rem", color: "var(--mint-green)" }}
            />
          </div>

          {/* Source */}
          <div className="form-group">
            <label className="label" htmlFor="income-source">Income Source</label>
            <input
              id="income-source"
              type="text"
              className="input"
              placeholder="e.g. Salary, Pocket Money, Freelance"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">{error}</div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", fontSize: "1rem" }}
            disabled={loading}
            id="btn-submit-income"
          >
            {loading ? "Logging..." : "Log Income ✓"}
          </button>
        </form>
      </div>
    </>
  );
}

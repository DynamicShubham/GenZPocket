"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import posthog from "posthog-js";

interface BudgetStatus {
  total_income: number;
  is_auto_income: boolean;
  overall: { limit: number; spent: number; remaining: number; pct: number };
  categories: any[];
}

interface Props {
  budgetStatus: BudgetStatus;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditBudgetModal({ budgetStatus, onClose, onSuccess }: Props) {
  const [isAutoIncome, setIsAutoIncome] = useState(budgetStatus.is_auto_income ?? true);
  const [customLimit, setCustomLimit] = useState(budgetStatus.overall.limit.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAutoIncome && !customLimit) {
      setError("Please enter a custom limit.");
      return;
    }
    setLoading(true);
    setError("");
    
    // We send a POST to /budgets to upsert the budget for the current month.
    const monthStr = new Date().toISOString().substring(0, 7) + "-01";
    
    try {
      const res = await apiFetch("/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: monthStr,
          overall_limit: isAutoIncome ? budgetStatus.total_income || 1 : parseFloat(customLimit),
          is_auto_income: isAutoIncome,
        }),
      });
      if (!res.ok) throw new Error("Failed to update budget");
      
      posthog.capture("budget_updated", {
        is_auto_income: isAutoIncome,
        custom_limit: parseFloat(customLimit),
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
      <div
        style={{
          position: "fixed", inset: 0, background: "rgba(13,13,13,0.55)",
          zIndex: 200, backdropFilter: "none",
        }}
        onClick={onClose}
      />
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
        <div className="row-between" style={{ marginBottom: "var(--space-3)" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.25rem" }}>
            Edit Budget
          </h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="stack stack-md">
          <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <input
              type="checkbox"
              id="auto-income"
              checked={isAutoIncome}
              onChange={(e) => setIsAutoIncome(e.target.checked)}
              style={{ width: "1.5rem", height: "1.5rem", accentColor: "var(--ink-black)" }}
            />
            <label htmlFor="auto-income" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem" }}>
              Use Total Income as Budget
            </label>
          </div>
          
          <div style={{ padding: "0.75rem", background: "var(--ink-black)", color: "var(--paper-white)", borderRadius: "var(--radius)" }}>
            <p className="caption" style={{ color: "var(--paper-white)", opacity: 0.8 }}>TOTAL MONTHLY INCOME</p>
            <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.5rem" }}>
              ₹{Math.round(budgetStatus.total_income ?? 0).toLocaleString("en-IN")}
            </p>
          </div>

          {!isAutoIncome && (
            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label className="label" htmlFor="custom-limit">Custom Budget Limit (₹)</label>
              <input
                id="custom-limit"
                type="number"
                min="0"
                step="1"
                className="input"
                placeholder="e.g. 50000"
                value={customLimit}
                onChange={(e) => setCustomLimit(e.target.value)}
                style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.25rem" }}
              />
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", fontSize: "1rem", marginTop: "1rem" }}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Budget"}
          </button>
        </form>
      </div>
    </>
  );
}

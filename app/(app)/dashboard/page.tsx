"use client";

import { TrendingUp, Flame, AlertCircle } from "lucide-react";
import { AddExpenseModal } from "@/components/expense/AddExpenseModal";
import { AddIncomeModal } from "@/components/income/AddIncomeModal";
import { useApi } from "@/lib/useApi";
import { useState, useCallback } from "react";

// ── Type definitions matching the FastAPI response shapes ──────────────────
interface BudgetStatus {
  total_income: number;
  is_auto_income: boolean;
  overall: {
    limit: number;
    spent: number;
    remaining: number;
    pct: number;
  };
  categories: Array<{
    name: string;
    limit: number;
    spent: number;
    remaining: number;
    pct: number;
  }>;
}

interface Expense {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string; // ISO date string "YYYY-MM-DD"
}

interface UserProfile {
  streak: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  FOOD: "🍕", TRAVEL: "🚗", SHOPPING: "🛍️", ENTERTAINMENT: "🎬",
  SUBSCRIPTIONS: "📱", EDUCATION: "📚", HEALTH: "💊", UTILITIES: "💡",
  RENT: "🏠", OTHER: "📦",
};

const CATEGORY_CHIP_CLASS: Record<string, string> = {
  FOOD: "chip chip-food", TRAVEL: "chip chip-travel", SHOPPING: "chip chip-shopping",
  ENTERTAINMENT: "chip chip-entertainment", SUBSCRIPTIONS: "chip chip-subscriptions",
  EDUCATION: "chip chip-education", HEALTH: "chip chip-health",
  UTILITIES: "chip chip-utilities", RENT: "chip chip-rent", OTHER: "chip chip-other",
};

function formatTxDate(isoDate: string): string {
  const d = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function Skeleton({ height = "1rem", width = "100%", style = {} }: { height?: string; width?: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      height, width, background: "linear-gradient(90deg,#e5e5e5 25%,#f0f0f0 50%,#e5e5e5 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
      borderRadius: "4px", ...style,
    }} />
  );
}

// ── Days left in month ────────────────────────────────────────────────────────
function daysLeftInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}

export default function DashboardPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const {
    data: budget,
    loading: budgetLoading,
    error: budgetError,
    refetch: refetchBudget,
  } = useApi<BudgetStatus>("/budgets/status");

  const {
    data: transactions,
    loading: txLoading,
    refetch: refetchTx,
  } = useApi<Expense[]>("/expenses?page=1&page_size=5");

  const { data: profile, refetch: refetchProfile } = useApi<UserProfile>("/users/me");

  const handleExpenseSuccess = useCallback(() => {
    refetchTx();
    refetchBudget();
    refetchProfile();
  }, [refetchTx, refetchBudget, refetchProfile]);

  const pct = budget?.overall?.pct ?? 0;
  const remaining = budget?.overall?.remaining ?? 0;
  const spent = budget?.overall?.spent ?? 0;
  const limit = budget?.overall?.limit ?? 0;
  const totalIncome = budget?.total_income ?? 0;
  const isAutoIncome = budget?.is_auto_income ?? true;
  const daysLeft = daysLeftInMonth();
  const streak = profile?.streak ?? 0;
  const barClass = pct >= 100 ? "progress-bar danger" : pct >= 80 ? "progress-bar warning" : "progress-bar";

  return (
    <div className="page animate-slide-up">
      {/* ── Balance Ledger Card ── */}
      <div className="ledger-card" style={{ marginBottom: "var(--space-3)" }}>
        <p className="caption" style={{ marginBottom: "0.25rem" }}>BALANCE LEFT THIS MONTH</p>

        {budgetLoading ? (
          <>
            <Skeleton height="2.5rem" width="60%" style={{ marginBottom: "0.5rem" }} />
            <Skeleton height="0.75rem" width="40%" style={{ marginBottom: "var(--space-2)" }} />
            <Skeleton height="0.5rem" />
          </>
        ) : budgetError ? (
          <div style={{ padding: "1rem 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--charcoal-grey)" }}>
              <AlertCircle size={16} />
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
                No budget set for this month
              </p>
            </div>
            <p className="caption" style={{ marginTop: "0.25rem" }}>
              Go to Budgets tab to set your monthly limit.
            </p>
          </div>
        ) : (
          <>
            <p
              className="text-display"
              style={{ fontFamily: "var(--font-display)", lineHeight: 1, marginBottom: "0.5rem" }}
            >
              ₹{Math.round(remaining).toLocaleString("en-IN")}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "var(--space-2)" }}>
              <span style={{ color: "var(--mint-green)", display: "flex", alignItems: "center", gap: "4px" }}>
                <TrendingUp size={14} />
                <span className="caption" style={{ color: "var(--mint-green)" }}>
                  {Math.round(pct)}% used
                </span>
              </span>
              <span className="caption">·</span>
              <span className="caption">{daysLeft} days left</span>
            </div>
            {/* Progress bar */}
            <div className="progress-track">
              <div className={barClass} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.375rem" }}>
              <span className="caption">₹{Math.round(spent).toLocaleString("en-IN")} spent</span>
              <span className="caption">of ₹{Math.round(limit).toLocaleString("en-IN")} {isAutoIncome ? "income" : "budget"}</span>
            </div>
          </>
        )}
      </div>

      {/* ── Quick Stats Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
        {/* Streak card */}
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Flame size={24} color="var(--alert-red)" strokeWidth={2.5} />
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.5rem", lineHeight: 1 }}>
              {streak}
            </p>
            <p className="caption">day streak 🔥</p>
          </div>
        </div>
        {/* Safe-to-spend today */}
        <div className="card">
          <p className="caption" style={{ marginBottom: "0.25rem" }}>SAFE TO SPEND</p>
          {budgetLoading ? (
            <Skeleton height="1.25rem" width="70%" />
          ) : (
            <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.25rem", lineHeight: 1 }}>
              {daysLeft > 0
                ? <>₹{Math.round(remaining / daysLeft).toLocaleString("en-IN")}<span className="caption">/day</span></>
                : <span className="caption">Month ends today</span>
              }
            </p>
          )}
        </div>
      </div>

      {/* ── Add Actions ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
        <button
          className="btn btn-secondary"
          style={{ width: "100%", fontSize: "1rem" }}
          onClick={() => setShowAddIncome(true)}
          id="btn-add-income"
        >
          + Log Income
        </button>
        <button
          className="btn btn-primary"
          style={{ width: "100%", fontSize: "1rem" }}
          onClick={() => setShowAdd(true)}
          id="btn-add-expense"
        >
          + Log Expense
        </button>
      </div>

      {/* ── Recent Transactions ── */}
      <div>
        <p className="section-label">RECENT TRANSACTIONS</p>
        {txLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.75rem" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="tx-row">
                <Skeleton height="2.5rem" width="2.5rem" style={{ borderRadius: "6px", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <Skeleton height="1rem" width="50%" style={{ marginBottom: "0.375rem" }} />
                  <Skeleton height="0.75rem" width="30%" />
                </div>
              </div>
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div style={{
            marginTop: "0.75rem", padding: "2rem", textAlign: "center",
            border: "2px dashed var(--charcoal-grey)", borderRadius: "var(--radius)",
          }}>
            <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💸</p>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>No expenses yet</p>
            <p className="caption">Tap &quot;Log Expense&quot; to add your first one.</p>
          </div>
        ) : (
          <div>
            {transactions.map((tx) => (
              <div key={tx.id} className="tx-row">
                <div className="tx-icon">
                  {CATEGORY_EMOJI[tx.category] || "📦"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="tx-merchant">{tx.merchant}</p>
                  <span className={CATEGORY_CHIP_CLASS[tx.category] || "chip chip-other"}>
                    {tx.category.charAt(0) + tx.category.slice(1).toLowerCase()}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="tx-amount negative">
                    -₹{Math.abs(Number(tx.amount)).toLocaleString("en-IN")}
                  </p>
                  <p className="caption">{formatTxDate(tx.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add Expense Modal ── */}
      {showAdd && (
        <AddExpenseModal
          onClose={() => setShowAdd(false)}
          onSuccess={handleExpenseSuccess}
        />
      )}

      {/* ── Add Income Modal ── */}
      {showAddIncome && (
        <AddIncomeModal
          onClose={() => setShowAddIncome(false)}
          onSuccess={handleExpenseSuccess}
        />
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { TrendingUp, Flame } from "lucide-react";
import { AddExpenseModal } from "@/components/expense/AddExpenseModal";

// ── Mock data (replace with API calls once auth is wired on client) ──
const MOCK_BUDGET = {
  remaining: 4230,
  total: 8000,
  spent: 3770,
  pctUsed: 47,
  daysLeft: 12,
};

const MOCK_TRANSACTIONS = [
  { id: "1", merchant: "Zomato",    category: "FOOD",          amount: -340, date: "Today" },
  { id: "2", merchant: "Uber",      category: "TRAVEL",        amount: -120, date: "Today" },
  { id: "3", merchant: "Netflix",   category: "ENTERTAINMENT", amount: -199, date: "Yesterday" },
  { id: "4", merchant: "Amazon",    category: "SHOPPING",      amount: -680, date: "Jul 29" },
  { id: "5", merchant: "Swiggy",    category: "FOOD",          amount: -260, date: "Jul 28" },
];

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

export default function DashboardPage() {
  const [showAdd, setShowAdd] = useState(false);
  const pct = MOCK_BUDGET.pctUsed;
  const barClass = pct >= 100 ? "progress-bar danger" : pct >= 80 ? "progress-bar warning" : "progress-bar";

  return (
    <div className="page animate-slide-up">
      {/* ── Stamped Ledger Card — Balance ── */}
      <div className="ledger-card" style={{ marginBottom: "var(--space-3)" }}>
        <p className="caption" style={{ marginBottom: "0.25rem" }}>BALANCE LEFT THIS MONTH</p>
        <p
          className="text-display"
          style={{ fontFamily: "var(--font-display)", lineHeight: 1, marginBottom: "0.5rem" }}
        >
          ₹{MOCK_BUDGET.remaining.toLocaleString("en-IN")}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "var(--space-2)" }}>
          <span style={{ color: "var(--mint-green)", display: "flex", alignItems: "center", gap: "4px" }}>
            <TrendingUp size={14} /> <span className="caption" style={{ color: "var(--mint-green)" }}>12% vs last month</span>
          </span>
          <span className="caption">·</span>
          <span className="caption">{MOCK_BUDGET.daysLeft} days left</span>
        </div>
        {/* Progress bar */}
        <div className="progress-track">
          <div className={barClass} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.375rem" }}>
          <span className="caption">₹{MOCK_BUDGET.spent.toLocaleString("en-IN")} spent</span>
          <span className="caption">{pct}% used</span>
        </div>
      </div>

      {/* ── Quick Stats Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
        {/* Streak card */}
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Flame size={24} color="var(--alert-red)" strokeWidth={2.5} />
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.5rem", lineHeight: 1 }}>7</p>
            <p className="caption">day streak 🔥</p>
          </div>
        </div>
        {/* Safe-to-spend today */}
        <div className="card">
          <p className="caption" style={{ marginBottom: "0.25rem" }}>SAFE TO SPEND</p>
          <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.25rem", lineHeight: 1 }}>
            ₹{Math.round(MOCK_BUDGET.remaining / MOCK_BUDGET.daysLeft).toLocaleString("en-IN")}
            <span className="caption">/day</span>
          </p>
        </div>
      </div>

      {/* ── Add Expense CTA ── */}
      <button
        className="btn btn-primary"
        style={{ width: "100%", marginBottom: "var(--space-3)", fontSize: "1rem" }}
        onClick={() => setShowAdd(true)}
        id="btn-add-expense"
      >
        + Log Expense
      </button>

      {/* ── Recent Transactions ── */}
      <div>
        <p className="section-label">RECENT TRANSACTIONS</p>
        <div>
          {MOCK_TRANSACTIONS.map((tx) => (
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
                <p className={`tx-amount ${tx.amount < 0 ? "negative" : "positive"}`}>
                  {tx.amount < 0 ? "-" : "+"}₹{Math.abs(tx.amount)}
                </p>
                <p className="caption">{tx.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Add Expense Modal ── */}
      {showAdd && <AddExpenseModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

const MOCK_BUDGETS = [
  { category: "FOOD",          limit: 2500, spent: 1420, color: "#FF6B35", emoji: "🍕" },
  { category: "TRAVEL",        limit: 1000, spent: 680,  color: "#2E5EFF", emoji: "🚗" },
  { category: "SHOPPING",      limit: 1500, spent: 900,  color: "#FFD500", emoji: "🛍️" },
  { category: "ENTERTAINMENT", limit: 500,  spent: 399,  color: "#B18CFF", emoji: "🎬" },
  { category: "SUBSCRIPTIONS", limit: 400,  spent: 371,  color: "#3A3A3A", emoji: "📱" },
];

const MOCK_GOALS = [
  { name: "Trip to Goa",    target: 15000, current: 7500,  deadline: "Oct 2026", emoji: "🏖️" },
  { name: "New Laptop",     target: 50000, current: 12000, deadline: "Dec 2026", emoji: "💻" },
  { name: "Emergency Fund", target: 10000, current: 3200,  deadline: "Nov 2026", emoji: "🛡️" },
];

function BudgetBar({ limit, spent, color }: { limit: number; spent: number; color: string }) {
  const pct = Math.min((spent / limit) * 100, 100);
  const isWarning = pct >= 80;
  const isDanger  = pct >= 100;
  const barColor  = isDanger ? "var(--alert-red)" : isWarning ? "var(--signal-yellow)" : color;

  return (
    <div className="progress-track">
      <div className="progress-bar" style={{ width: `${pct}%`, background: barColor }} />
    </div>
  );
}

export default function BudgetsPage() {
  const [activeTab, setActiveTab] = useState<"budgets" | "goals">("budgets");
  const overall = { limit: 8000, spent: MOCK_BUDGETS.reduce((s, b) => s + b.spent, 0) };
  const overallPct = Math.round((overall.spent / overall.limit) * 100);

  return (
    <div className="page animate-slide-up">
      <div className="page-header">
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.75rem" }}>Budget & Goals</h1>
        <button className="btn btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
          <Plus size={14} /> Edit
        </button>
      </div>

      {/* ── Tab Toggle ── */}
      <div style={{
        display: "flex", border: "var(--border-thick)", borderRadius: "var(--radius)",
        overflow: "hidden", marginBottom: "var(--space-3)",
      }}>
        {(["budgets", "goals"] as const).map((tab) => (
          <button
            key={tab}
            id={`tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: "0.625rem", fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "0.875rem", textTransform: "uppercase", cursor: "pointer",
              background: activeTab === tab ? "var(--ink-black)" : "var(--paper-white)",
              color: activeTab === tab ? "var(--paper-white)" : "var(--ink-black)",
              border: "none", borderRight: tab === "budgets" ? "var(--border-thick)" : "none",
              transition: "all var(--duration-fast)",
            }}
          >
            {tab === "budgets" ? "💼 Budgets" : "🎯 Goals"}
          </button>
        ))}
      </div>

      {activeTab === "budgets" && (
        <div className="stack stack-md">
          {/* Overall ledger card */}
          <div className="ledger-card">
            <p className="caption">OVERALL BUDGET — JULY 2026</p>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2rem", marginTop: "0.25rem" }}>
              ₹{(overall.limit - overall.spent).toLocaleString("en-IN")} <span className="caption">left</span>
            </p>
            <BudgetBar limit={overall.limit} spent={overall.spent} color="var(--electric-blue)" />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.375rem" }}>
              <span className="caption">₹{overall.spent.toLocaleString("en-IN")} spent</span>
              <span className="caption">{overallPct}% of ₹{overall.limit.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Category budget cards */}
          {MOCK_BUDGETS.map((b) => {
            const pct = Math.round((b.spent / b.limit) * 100);
            const remaining = b.limit - b.spent;
            const isDanger = pct >= 100;
            return (
              <div key={b.category} className="card" style={{ borderTop: `4px solid ${b.color}` }}>
                <div className="row-between" style={{ marginBottom: "0.625rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.25rem" }}>{b.emoji}</span>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
                      {b.category.charAt(0) + b.category.slice(1).toLowerCase()}
                    </span>
                  </div>
                  {isDanger && (
                    <span className="badge badge-danger" style={{
                      background: "var(--alert-red)", color: "#fff",
                      border: "2px solid var(--ink-black)", borderRadius: "var(--radius)",
                      padding: "0.2rem 0.5rem", fontSize: "0.625rem", fontWeight: 700,
                    }}>OVER</span>
                  )}
                </div>
                <BudgetBar limit={b.limit} spent={b.spent} color={b.color} />
                <div className="row-between" style={{ marginTop: "0.375rem" }}>
                  <span className="caption">₹{b.spent} / ₹{b.limit}</span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.875rem",
                    color: isDanger ? "var(--alert-red)" : remaining < b.limit * 0.2 ? "var(--signal-yellow)" : "var(--mint-green)",
                  }}>
                    {isDanger ? `-₹${Math.abs(remaining)}` : `₹${remaining} left`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "goals" && (
        <div className="stack stack-md">
          {MOCK_GOALS.map((goal) => {
            const pct = Math.round((goal.current / goal.target) * 100);
            return (
              <div key={goal.name} className="card">
                <div className="row-between" style={{ marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.5rem" }}>{goal.emoji}</span>
                    <div>
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem" }}>{goal.name}</p>
                      <p className="caption">by {goal.deadline}</p>
                    </div>
                  </div>
                  <div
                    className="health-score-stamp"
                    style={{ width: "3.5rem", height: "3.5rem", fontSize: "1rem", transform: "rotate(-2deg)" }}
                  >
                    {pct}%
                  </div>
                </div>
                <div className="progress-track">
                  <div className="progress-bar success" style={{ width: `${pct}%` }} />
                </div>
                <div className="row-between" style={{ marginTop: "0.375rem" }}>
                  <span className="caption">₹{goal.current.toLocaleString("en-IN")} saved</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.875rem" }}>
                    ₹{goal.target.toLocaleString("en-IN")} target
                  </span>
                </div>
              </div>
            );
          })}

          <button className="btn btn-secondary" style={{ width: "100%" }} id="btn-add-goal">
            <Plus size={16} /> Add New Goal
          </button>
        </div>
      )}
    </div>
  );
}

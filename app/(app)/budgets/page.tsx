"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import posthog from "posthog-js";
import { useApi } from "@/lib/useApi";

// ── Type definitions ──────────────────────────────────────────────────────────
interface CategoryBudget {
  name: string;
  limit: number;
  spent: number;
  remaining: number;
  pct: number;
}

interface BudgetStatus {
  overall: { limit: number; spent: number; remaining: number; pct: number };
  categories: CategoryBudget[];
}

interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string; // "YYYY-MM-DD"
}

// ── Category meta ─────────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { color: string; emoji: string }> = {
  FOOD:          { color: "#FF6B35", emoji: "🍕" },
  TRAVEL:        { color: "#2E5EFF", emoji: "🚗" },
  SHOPPING:      { color: "#FFD500", emoji: "🛍️" },
  ENTERTAINMENT: { color: "#B18CFF", emoji: "🎬" },
  SUBSCRIPTIONS: { color: "#3A3A3A", emoji: "📱" },
  EDUCATION:     { color: "#22C55E", emoji: "📚" },
  HEALTH:        { color: "#EF4444", emoji: "💊" },
  UTILITIES:     { color: "#F97316", emoji: "💡" },
  RENT:          { color: "#8B5CF6", emoji: "🏠" },
  OTHER:         { color: "#6B7280", emoji: "📦" },
};

// ── Goal deadline display ─────────────────────────────────────────────────────
function formatDeadline(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

// ── Progress bar component ────────────────────────────────────────────────────
function BudgetBar({ pct, color }: { pct: number; color: string }) {
  const isWarning = pct >= 80;
  const isDanger  = pct >= 100;
  const barColor  = isDanger ? "var(--alert-red)" : isWarning ? "var(--signal-yellow)" : color;
  return (
    <div className="progress-track">
      <div className="progress-bar" style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ height = "1rem", width = "100%" }: { height?: string; width?: string }) {
  return (
    <div style={{
      height, width,
      background: "linear-gradient(90deg,#e5e5e5 25%,#f0f0f0 50%,#e5e5e5 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
      borderRadius: "4px",
    }} />
  );
}

export default function BudgetsPage() {
  const [activeTab, setActiveTab] = useState<"budgets" | "goals">("budgets");

  const { data: budget, loading: budgetLoading, error: budgetError } = useApi<BudgetStatus>("/budgets/status");
  const { data: goals, loading: goalsLoading } = useApi<SavingsGoal[]>("/goals");

  const overall = {
    limit: Number(budget?.overall?.limit ?? 0),
    spent: Number(budget?.overall?.spent ?? 0),
    remaining: Number(budget?.overall?.remaining ?? 0),
    pct: budget?.overall?.pct ?? 0,
  };

  const currentMonthLabel = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" }).toUpperCase();

  return (
    <div className="page animate-slide-up">
      <div className="page-header">
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.75rem" }}>Budget &amp; Goals</h1>
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
            onClick={() => {
              posthog.capture("budget_tab_switched", { tab });
              setActiveTab(tab);
            }}
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

      {/* ── Budgets Tab ── */}
      {activeTab === "budgets" && (
        <div className="stack stack-md">
          {budgetLoading ? (
            <>
              <Skeleton height="120px" />
              <Skeleton height="90px" />
              <Skeleton height="90px" />
            </>
          ) : budgetError ? (
            <div style={{
              padding: "2.5rem 1rem", textAlign: "center",
              border: "2px dashed var(--charcoal-grey)", borderRadius: "var(--radius)",
            }}>
              <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💼</p>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>No budget set</p>
              <p className="caption" style={{ marginTop: "0.25rem" }}>
                Create your first budget to track spending by category.
              </p>
            </div>
          ) : (
            <>
              {/* Overall ledger card */}
              <div className="ledger-card">
                <p className="caption">OVERALL BUDGET — {currentMonthLabel}</p>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2rem", marginTop: "0.25rem" }}>
                  ₹{Math.round(overall.remaining).toLocaleString("en-IN")} <span className="caption">left</span>
                </p>
                <BudgetBar pct={overall.pct} color="var(--electric-blue)" />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.375rem" }}>
                  <span className="caption">₹{Math.round(overall.spent).toLocaleString("en-IN")} spent</span>
                  <span className="caption">{Math.round(overall.pct)}% of ₹{Math.round(overall.limit).toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Category budget cards */}
              {(budget?.categories ?? [])
                .filter((b) => Number(b.limit) > 0)
                .map((b) => {
                  const meta = CATEGORY_META[b.name] ?? { color: "#6B7280", emoji: "📦" };
                  const spent = Number(b.spent);
                  const limit = Number(b.limit);
                  const remaining = Number(b.remaining);
                  const pct = b.pct;
                  const isDanger = pct >= 100;

                  return (
                    <div key={b.name} className="card" style={{ borderTop: `4px solid ${meta.color}` }}>
                      <div className="row-between" style={{ marginBottom: "0.625rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "1.25rem" }}>{meta.emoji}</span>
                          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
                            {b.name.charAt(0) + b.name.slice(1).toLowerCase()}
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
                      <BudgetBar pct={pct} color={meta.color} />
                      <div className="row-between" style={{ marginTop: "0.375rem" }}>
                        <span className="caption">₹{Math.round(spent)} / ₹{Math.round(limit)}</span>
                        <span style={{
                          fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.875rem",
                          color: isDanger ? "var(--alert-red)" : remaining < limit * 0.2 ? "var(--signal-yellow)" : "var(--mint-green)",
                        }}>
                          {isDanger ? `-₹${Math.abs(Math.round(remaining))}` : `₹${Math.round(remaining)} left`}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </>
          )}
        </div>
      )}

      {/* ── Goals Tab ── */}
      {activeTab === "goals" && (
        <div className="stack stack-md">
          {goalsLoading ? (
            <>
              <Skeleton height="110px" />
              <Skeleton height="110px" />
            </>
          ) : !goals || goals.length === 0 ? (
            <div style={{
              padding: "2.5rem 1rem", textAlign: "center",
              border: "2px dashed var(--charcoal-grey)", borderRadius: "var(--radius)",
            }}>
              <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎯</p>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>No savings goals yet</p>
              <p className="caption" style={{ marginTop: "0.25rem" }}>
                Add a goal below to start tracking your savings.
              </p>
            </div>
          ) : (
            goals.map((goal) => {
              const target = Number(goal.target_amount);
              const current = Number(goal.current_amount);
              const pct = Math.round((current / target) * 100);
              return (
                <div key={goal.id} className="card">
                  <div className="row-between" style={{ marginBottom: "0.75rem" }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem" }}>{goal.name}</p>
                      <p className="caption">by {formatDeadline(goal.deadline)}</p>
                    </div>
                    <div
                      className="health-score-stamp"
                      style={{ width: "3.5rem", height: "3.5rem", fontSize: "1rem", transform: "rotate(-2deg)" }}
                    >
                      {pct}%
                    </div>
                  </div>
                  <div className="progress-track">
                    <div className="progress-bar success" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="row-between" style={{ marginTop: "0.375rem" }}>
                    <span className="caption">₹{Math.round(current).toLocaleString("en-IN")} saved</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.875rem" }}>
                      ₹{Math.round(target).toLocaleString("en-IN")} target
                    </span>
                  </div>
                </div>
              );
            })
          )}

          <button
            className="btn btn-secondary"
            style={{ width: "100%" }}
            id="btn-add-goal"
            onClick={() => posthog.capture("goal_add_clicked")}
          >
            <Plus size={16} /> Add New Goal
          </button>
        </div>
      )}
    </div>
  );
}

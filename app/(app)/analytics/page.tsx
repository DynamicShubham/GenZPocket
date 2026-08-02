"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, type PieLabelRenderProps,
} from "recharts";
import { useApi } from "@/lib/useApi";

// ── Type definitions ──────────────────────────────────────────────────────────
interface MonthlyReport {
  month: string;        // "YYYY-MM-DD"
  total_expenses: number;
  health_score: number;
}

interface CategoryBudgetStatus {
  name: string;
  spent: number;
  limit: number;
}

interface BudgetStatus {
  overall: { spent: number; limit: number };
  categories: CategoryBudgetStatus[];
}

// ── Category color/label map ──────────────────────────────────────────────────
const CATEGORY_META: Record<string, { color: string; label: string }> = {
  FOOD:          { color: "#FF6B35", label: "Food" },
  TRAVEL:        { color: "#2E5EFF", label: "Travel" },
  SHOPPING:      { color: "#FFD500", label: "Shopping" },
  ENTERTAINMENT: { color: "#B18CFF", label: "Entertainment" },
  SUBSCRIPTIONS: { color: "#3A3A3A", label: "Subs" },
  EDUCATION:     { color: "#22C55E", label: "Education" },
  HEALTH:        { color: "#EF4444", label: "Health" },
  UTILITIES:     { color: "#F97316", label: "Utilities" },
  RENT:          { color: "#8B5CF6", label: "Rent" },
  OTHER:         { color: "#6B7280", label: "Other" },
};

// ── Tooltip ───────────────────────────────────────────────────────────────────
interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "var(--paper-white)",
        border: "2px solid var(--ink-black)",
        padding: "0.5rem 0.75rem",
        boxShadow: "3px 3px 0 var(--ink-black)",
        fontFamily: "var(--font-mono)",
        fontSize: "0.875rem",
      }}>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{label}</p>
        <p>₹{payload[0]?.value?.toLocaleString("en-IN")}</p>
      </div>
    );
  }
  return null;
};

// ── Pie label ─────────────────────────────────────────────────────────────────
const RADIAN = Math.PI / 180;

const renderCustomLabel = (props: PieLabelRenderProps) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (!cx || !cy || !midAngle || !innerRadius || !outerRadius || (percent ?? 0) < 0.08) return null;
  const ir = Number(innerRadius);
  const or = Number(outerRadius);
  const radius = ir + (or - ir) * 0.5;
  const x = Number(cx) + radius * Math.cos(-Number(midAngle) * RADIAN);
  const y = Number(cy) + radius * Math.sin(-Number(midAngle) * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "11px" }}>
      {`${((percent ?? 0) * 100).toFixed(0)}%`}
    </text>
  );
};

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

// ── Current month label ───────────────────────────────────────────────────────
function currentMonthLabel(): string {
  return new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

// ── Short month name from YYYY-MM-DD ─────────────────────────────────────────
function shortMonth(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-IN", { month: "short" });
}

export default function AnalyticsPage() {
  const { data: reports, loading: reportsLoading } = useApi<MonthlyReport[]>("/reports");
  const { data: budget, loading: budgetLoading } = useApi<BudgetStatus>("/budgets/status");

  // ── Transform reports → bar chart data (last 6 months) ──
  const monthlyData = reports
    ? [...reports]
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6)
        .map((r) => ({
          month: shortMonth(r.month),
          amount: Math.round(Number(r.total_expenses)),
        }))
    : [];

  // ── Transform budget categories → pie/bar data ──
  const categoryData = budget
    ? budget.categories
        .filter((c) => Number(c.spent) > 0)
        .map((c) => ({
          name: CATEGORY_META[c.name]?.label ?? c.name,
          value: Math.round(Number(c.spent)),
          color: CATEGORY_META[c.name]?.color ?? "#6B7280",
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  const isEmpty = !reportsLoading && !budgetLoading && monthlyData.length === 0 && categoryData.length === 0;

  return (
    <div className="page animate-slide-up">
      <div className="page-header">
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.75rem" }}>
          Analytics
        </h1>
        <span className="caption">{currentMonthLabel()}</span>
      </div>

      {isEmpty && (
        <div style={{
          padding: "3rem 1rem", textAlign: "center",
          border: "2px dashed var(--charcoal-grey)", borderRadius: "var(--radius)",
        }}>
          <p style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📊</p>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem" }}>
            No data yet
          </p>
          <p className="caption" style={{ marginTop: "0.25rem" }}>
            Log expenses and set a budget to see your analytics here.
          </p>
        </div>
      )}

      {/* ── Month-over-Month Bar Chart ── */}
      {(reportsLoading || monthlyData.length > 0) && (
        <div className="card" style={{ marginBottom: "var(--space-3)" }}>
          <p className="section-label" style={{ marginBottom: "var(--space-2)" }}>MONTHLY SPENDING</p>
          {reportsLoading ? (
            <Skeleton height="180px" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData} barSize={36}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--ink-black)" strokeOpacity={0.15} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, fill: "var(--ink-black)" }}
                  axisLine={{ stroke: "var(--ink-black)", strokeWidth: 2 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "var(--charcoal-grey)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(46,94,255,0.08)" }} />
                <Bar dataKey="amount" fill="var(--electric-blue)" stroke="var(--ink-black)" strokeWidth={2} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* ── Category Donut ── */}
      {(budgetLoading || categoryData.length > 0) && (
        <div className="card" style={{ marginBottom: "var(--space-3)" }}>
          <p className="section-label" style={{ marginBottom: "var(--space-2)" }}>BY CATEGORY — THIS MONTH</p>
          {budgetLoading ? (
            <Skeleton height="160px" />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={72}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="var(--ink-black)"
                    labelLine={false}
                    label={renderCustomLabel}
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div style={{ flex: 1 }} className="stack stack-sm">
                {categoryData.map((cat) => (
                  <div key={cat.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{
                        width: 10, height: 10, borderRadius: 2, background: cat.color,
                        border: "1.5px solid var(--ink-black)", flexShrink: 0,
                      }} />
                      <span style={{ fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: 700 }}>{cat.name}</span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", fontWeight: 700 }}>
                      ₹{cat.value.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Top Spends ── */}
      {(budgetLoading || categoryData.length > 0) && (
        <div className="card">
          <p className="section-label" style={{ marginBottom: "var(--space-2)" }}>TOP CATEGORIES</p>
          {budgetLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} height="2.5rem" />)}
            </div>
          ) : (
            categoryData.map((cat, i) => {
              const max = Math.max(...categoryData.map((c) => c.value));
              const pct = (cat.value / max) * 100;
              return (
                <div key={cat.name} style={{ marginBottom: "0.875rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.875rem" }}>
                      #{i + 1} {cat.name}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.875rem" }}>
                      ₹{cat.value.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="progress-track" style={{ height: "0.75rem" }}>
                    <div className="progress-bar" style={{ width: `${pct}%`, background: cat.color }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

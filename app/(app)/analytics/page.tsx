"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, type PieLabelRenderProps,
} from "recharts";

const MONTHLY_DATA = [
  { month: "Mar", amount: 6200 },
  { month: "Apr", amount: 5800 },
  { month: "May", amount: 7100 },
  { month: "Jun", amount: 6500 },
  { month: "Jul", amount: 3770 },
];

const CATEGORY_DATA = [
  { name: "Food",          value: 1420, color: "#FF6B35" },
  { name: "Travel",        value: 680,  color: "#2E5EFF" },
  { name: "Shopping",      value: 900,  color: "#FFD500" },
  { name: "Entertainment", value: 399,  color: "#B18CFF" },
  { name: "Subs",          value: 371,  color: "#3A3A3A" },
];

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

const RADIAN = Math.PI / 180;

const renderCustomLabel = (props: PieLabelRenderProps) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  // All PieLabelRenderProps fields are optional — guard against undefined
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

export default function AnalyticsPage() {
  return (
    <div className="page animate-slide-up">
      <div className="page-header">
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.75rem" }}>
          Analytics
        </h1>
        <span className="caption">July 2026</span>
      </div>

      {/* ── Month-over-Month Bar Chart ── */}
      <div className="card" style={{ marginBottom: "var(--space-3)" }}>
        <p className="section-label" style={{ marginBottom: "var(--space-2)" }}>MONTHLY SPENDING</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={MONTHLY_DATA} barSize={36}>
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
            <Bar dataKey="amount" fill="var(--electric-blue)" stroke="var(--ink-black)" strokeWidth={2} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Category Donut ── */}
      <div className="card" style={{ marginBottom: "var(--space-3)" }}>
        <p className="section-label" style={{ marginBottom: "var(--space-2)" }}>BY CATEGORY — JULY</p>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <ResponsiveContainer width="50%" height={160}>
            <PieChart>
              <Pie
                data={CATEGORY_DATA}
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
                {CATEGORY_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div style={{ flex: 1 }} className="stack stack-sm">
            {CATEGORY_DATA.map((cat) => (
              <div key={cat.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: 2, background: cat.color,
                    border: "1.5px solid var(--ink-black)", flexShrink: 0,
                  }} />
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "0.8125rem", fontWeight: 700 }}>{cat.name}</span>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", fontWeight: 700 }}>₹{cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top Spends ── */}
      <div className="card">
        <p className="section-label" style={{ marginBottom: "var(--space-2)" }}>TOP 5 CATEGORIES</p>
        {CATEGORY_DATA.map((cat, i) => {
          const max = Math.max(...CATEGORY_DATA.map(c => c.value));
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
        })}
      </div>
    </div>
  );
}

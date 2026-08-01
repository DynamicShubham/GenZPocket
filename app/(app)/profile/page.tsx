"use client";

import { Flame, Download, BarChart2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import posthog from "posthog-js";

const MOCK_USER = {
  name: "Riya Sharma",
  email: "riya@example.com",
  streak: 7,
  currency: "INR",
  healthScore: 72,
  badges: [
    { id: "first_log",      name: "First Step 👣",    color: "var(--mint-green)" },
    { id: "streak_7",       name: "Week Warrior 🔥",  color: "var(--alert-red)" },
    { id: "budget_setter",  name: "Budget Boss 💼",   color: "var(--electric-blue)" },
    { id: "goal_creator",   name: "Goal Getter 🎯",   color: "var(--lilac-pop)" },
  ],
};

const MOCK_REPORT = {
  month: "July 2026",
  totalExpenses: 3770,
  savings: 4230,
  healthScore: 72,
};

export default function ProfilePage() {
  const router = useRouter();

  const handleSettingClick = async (label: string) => {
    posthog.capture("setting_clicked", { setting: label });
    if (label === "Sign Out") {
      posthog.capture("user_logged_out");
      posthog.reset();
      await signOut();
      router.push("/login");
    }
  };

  return (
    <div className="page animate-slide-up">
      {/* ── User Info ── */}
      <div className="ledger-card" style={{ marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <div style={{
          width: 60, height: 60, background: "var(--electric-blue)",
          border: "3px solid var(--ink-black)", borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-md)", display: "flex", alignItems: "center",
          justifyContent: "center", fontFamily: "var(--font-display)", fontSize: "1.75rem",
          fontWeight: 700, color: "#fff", flexShrink: 0,
        }}>
          {MOCK_USER.name.charAt(0)}
        </div>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.125rem" }}>
            {MOCK_USER.name}
          </h1>
          <p className="caption">{MOCK_USER.email}</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginTop: "0.375rem" }}>
            <Flame size={14} color="var(--alert-red)" />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.875rem" }}>
              {MOCK_USER.streak}-day streak
            </span>
          </div>
        </div>
      </div>

      {/* ── Monthly Report Card ── */}
      <div className="card" style={{ marginBottom: "var(--space-3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p className="section-label" style={{ marginBottom: "0.5rem" }}>{MOCK_REPORT.month} REPORT</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
              <div>
                <p className="caption">SPENT</p>
                <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.125rem", color: "var(--alert-red)" }}>
                  ₹{MOCK_REPORT.totalExpenses.toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="caption">SAVED</p>
                <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.125rem", color: "var(--mint-green)" }}>
                  ₹{MOCK_REPORT.savings.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>
          {/* Stamped health score */}
          <div className="health-score-stamp" style={{
            width: "5rem", height: "5rem", fontSize: "1.5rem",
            background: MOCK_REPORT.healthScore >= 70 ? "var(--mint-green)" : MOCK_REPORT.healthScore >= 50 ? "var(--signal-yellow)" : "var(--alert-red)",
            color: MOCK_REPORT.healthScore >= 50 ? "var(--ink-black)" : "#fff",
          }}>
            {MOCK_REPORT.healthScore}
          </div>
        </div>
        <div className="divider" style={{ margin: "var(--space-2) 0" }} />
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1, padding: "0.5rem", fontSize: "0.8125rem" }}
            id="btn-download-report"
            onClick={() => posthog.capture("report_download_clicked", { month: MOCK_REPORT.month })}
          >
            <Download size={14} /> PDF Report
          </button>
          <button className="btn btn-secondary" style={{ flex: 1, padding: "0.5rem", fontSize: "0.8125rem" }} id="btn-view-analytics">
            <BarChart2 size={14} /> Analytics
          </button>
        </div>
      </div>

      {/* ── Badges ── */}
      <div className="card" style={{ marginBottom: "var(--space-3)" }}>
        <p className="section-label" style={{ marginBottom: "var(--space-2)" }}>BADGES EARNED</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
          {MOCK_USER.badges.map((badge) => (
            <div
              key={badge.id}
              className="badge"
              style={{ background: badge.color, color: badge.color === "var(--signal-yellow)" ? "var(--ink-black)" : "#fff" }}
            >
              {badge.name}
            </div>
          ))}
          {/* Locked badge placeholder */}
          <div className="badge" style={{ background: "#e5e5e5", color: "var(--charcoal-grey)", border: "2px dashed var(--charcoal-grey)" }}>
            🔒 Month Master
          </div>
          <div className="badge" style={{ background: "#e5e5e5", color: "var(--charcoal-grey)", border: "2px dashed var(--charcoal-grey)" }}>
            🔒 Century Club
          </div>
        </div>
      </div>

      {/* ── Settings stubs ── */}
      <div className="card">
        <p className="section-label" style={{ marginBottom: "var(--space-2)" }}>SETTINGS</p>
        {[
          { label: "Currency", value: "₹ INR", icon: "💱" },
          { label: "Notifications", value: "On", icon: "🔔" },
          { label: "Privacy & Data", value: "Manage", icon: "🔒" },
          { label: "Sign Out", value: "", icon: "🚪" },
        ].map(({ label, value, icon }) => (
          <button
            key={label}
            id={`setting-${label.toLowerCase().replace(/\s/g, "-")}`}
            onClick={() => handleSettingClick(label)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", padding: "0.875rem 0",
              borderBottom: "1.5px solid var(--ink-black)", background: "none",
              cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "0.9375rem",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <span>{icon}</span> {label}
            </span>
            <span className="caption">{value} →</span>
          </button>
        ))}
      </div>
    </div>
  );
}

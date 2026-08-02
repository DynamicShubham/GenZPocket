"use client";

import { Flame, Download, BarChart2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import posthog from "posthog-js";
import { useApi } from "@/lib/useApi";
import { apiFetch } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  currency: string;
  streak: number;
  badges: Array<{ id: string; badge_id: string; earned_at: string }>;
}

interface MonthlyReport {
  id: string;
  month: string;
  total_expenses: number;
  savings: number;
  health_score: number;
}

// ── Badge display map ─────────────────────────────────────────────────────────
const BADGE_META: Record<string, { name: string; color: string }> = {
  first_log:     { name: "First Step 👣",   color: "var(--mint-green)" },
  streak_7:      { name: "Week Warrior 🔥", color: "var(--alert-red)" },
  streak_30:     { name: "Month Master 🗓️",  color: "var(--electric-blue)" },
  budget_setter: { name: "Budget Boss 💼",  color: "var(--electric-blue)" },
  goal_creator:  { name: "Goal Getter 🎯",  color: "var(--lilac-pop)" },
  century_club:  { name: "Century Club 💯", color: "var(--signal-yellow)" },
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ height = "1rem", width = "100%", style = {} }: {
  height?: string; width?: string; style?: React.CSSProperties
}) {
  return (
    <div style={{
      height, width,
      background: "linear-gradient(90deg,#e5e5e5 25%,#f0f0f0 50%,#e5e5e5 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
      borderRadius: "4px",
      ...style,
    }} />
  );
}

function monthLabel(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: profile, loading: profileLoading } = useApi<UserProfile>("/users/me");
  const { data: reports, loading: reportsLoading } = useApi<MonthlyReport[]>("/reports");

  // Latest report
  const latestReport = reports && reports.length > 0
    ? [...reports].sort((a, b) => b.month.localeCompare(a.month))[0]
    : null;

  // Fall back to session data if profile hasn't loaded yet
  const displayName = profile?.name ?? session?.user?.name ?? "User";
  const displayEmail = profile?.email ?? session?.user?.email ?? "";
  const displayInitial = displayName.charAt(0).toUpperCase();
  const streak = profile?.streak ?? 0;
  const badges = profile?.badges ?? [];

  const handleSettingClick = async (label: string) => {
    posthog.capture("setting_clicked", { setting: label });
    if (label === "Sign Out") {
      posthog.capture("user_logged_out");
      posthog.reset();
      await signOut();
      router.push("/login");
    }
  };

  const handleDownloadReport = async () => {
    if (!latestReport) return;
    const d = new Date(latestReport.month);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    posthog.capture("report_download_clicked", { month: latestReport.month });
    const res = await apiFetch(`/reports/${year}/${month}/pdf`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `genzpocket-statement-${year}-${String(month).padStart(2, "0")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
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
          {displayInitial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {profileLoading ? (
            <>
              <Skeleton height="1.25rem" width="60%" style={{ marginBottom: "0.375rem" }} />
              <Skeleton height="0.875rem" width="80%" />
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.125rem" }}>
                {displayName}
              </h1>
              <p className="caption">{displayEmail}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginTop: "0.375rem" }}>
                <Flame size={14} color="var(--alert-red)" />
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.875rem" }}>
                  {streak}-day streak
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Monthly Report Card ── */}
      <div className="card" style={{ marginBottom: "var(--space-3)" }}>
        {reportsLoading ? (
          <>
            <Skeleton height="1rem" width="50%" style={{ marginBottom: "0.75rem" }} />
            <Skeleton height="2rem" />
          </>
        ) : latestReport ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p className="section-label" style={{ marginBottom: "0.5rem" }}>{monthLabel(latestReport.month)} REPORT</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
                  <div>
                    <p className="caption">SPENT</p>
                    <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.125rem", color: "var(--alert-red)" }}>
                      ₹{Math.round(Number(latestReport.total_expenses)).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <p className="caption">SAVED</p>
                    <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.125rem", color: "var(--mint-green)" }}>
                      ₹{Math.round(Number(latestReport.savings)).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
              {/* Stamped health score */}
              <div className="health-score-stamp" style={{
                width: "5rem", height: "5rem", fontSize: "1.5rem",
                background: latestReport.health_score >= 70 ? "var(--mint-green)" : latestReport.health_score >= 50 ? "var(--signal-yellow)" : "var(--alert-red)",
                color: latestReport.health_score >= 50 ? "var(--ink-black)" : "#fff",
              }}>
                {latestReport.health_score}
              </div>
            </div>
            <div className="divider" style={{ margin: "var(--space-2) 0" }} />
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, padding: "0.5rem", fontSize: "0.8125rem" }}
                id="btn-download-report"
                onClick={handleDownloadReport}
              >
                <Download size={14} /> PDF Report
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, padding: "0.5rem", fontSize: "0.8125rem" }} id="btn-view-analytics"
                onClick={() => router.push("/analytics")}>
                <BarChart2 size={14} /> Analytics
              </button>
            </div>
          </>
        ) : (
          <div style={{ padding: "1rem 0", textAlign: "center" }}>
            <p style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>📋</p>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.875rem" }}>
              No report yet
            </p>
            <p className="caption">Reports generate automatically at month-end.</p>
          </div>
        )}
      </div>

      {/* ── Badges ── */}
      <div className="card" style={{ marginBottom: "var(--space-3)" }}>
        <p className="section-label" style={{ marginBottom: "var(--space-2)" }}>BADGES EARNED</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
          {profileLoading ? (
            <Skeleton height="2rem" width="120px" />
          ) : badges.length === 0 ? (
            <p className="caption">No badges yet — keep logging expenses to earn them!</p>
          ) : (
            badges.map((badge) => {
              const meta = BADGE_META[badge.badge_id] ?? { name: badge.badge_id, color: "var(--electric-blue)" };
              return (
                <div
                  key={badge.id}
                  className="badge"
                  style={{
                    background: meta.color,
                    color: meta.color === "var(--signal-yellow)" ? "var(--ink-black)" : "#fff",
                  }}
                >
                  {meta.name}
                </div>
              );
            })
          )}
          {/* Locked badge placeholders */}
          {!profileLoading && (
            <>
              <div className="badge" style={{ background: "#e5e5e5", color: "var(--charcoal-grey)", border: "2px dashed var(--charcoal-grey)" }}>
                🔒 Month Master
              </div>
              <div className="badge" style={{ background: "#e5e5e5", color: "var(--charcoal-grey)", border: "2px dashed var(--charcoal-grey)" }}>
                🔒 Century Club
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Settings ── */}
      <div className="card">
        <p className="section-label" style={{ marginBottom: "var(--space-2)" }}>SETTINGS</p>
        {[
          { label: "Currency", value: profile?.currency ? `₹ ${profile.currency}` : "₹ INR", icon: "💱" },
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

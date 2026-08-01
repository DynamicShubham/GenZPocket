"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, CheckCheck, AlertTriangle, CalendarClock, TrendingUp, Info } from "lucide-react";
import { apiFetch } from "@/lib/api";

/* ── Types ─────────────────────────────────────────────────────────── */

interface Notification {
  id: string;
  user_id: string;
  type: "BUDGET_50" | "BUDGET_80" | "BUDGET_100" | "WEEKLY_CHECKIN" | "RECURRING_DUE";
  message: string;
  is_read: boolean;
  created_at: string;
}

/* ── Helpers ───────────────────────────────────────────────────────── */

const TYPE_META: Record<string, { icon: React.ReactNode; accent: string; label: string }> = {
  BUDGET_50:     { icon: <TrendingUp size={18} />,      accent: "var(--signal-yellow)", label: "Budget 50%" },
  BUDGET_80:     { icon: <AlertTriangle size={18} />,    accent: "var(--alert-red)",     label: "Budget 80%" },
  BUDGET_100:    { icon: <AlertTriangle size={18} />,    accent: "var(--alert-red)",     label: "Over Budget" },
  WEEKLY_CHECKIN:{ icon: <CalendarClock size={18} />,    accent: "var(--electric-blue)", label: "Weekly Check-in" },
  RECURRING_DUE: { icon: <CalendarClock size={18} />,    accent: "var(--lilac-pop)",     label: "Recurring Due" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/* ── Page Component ────────────────────────────────────────────────── */

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      const res = await apiFetch(`/notifications?unread_only=${!showAll}`);
      if (!res.ok) throw new Error("Failed to load notifications");
      const data: Notification[] = await res.json();
      setNotifications(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [showAll]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function markRead(id: string) {
    try {
      const res = await apiFetch(`/notifications/${id}/read`, { method: "PUT" });
      if (!res.ok) throw new Error();
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      /* silently fail — optimistic update rollback could be added */
    }
  }

  async function markAllRead() {
    try {
      const res = await apiFetch("/notifications/read-all", { method: "PUT" });
      if (!res.ok) throw new Error();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      /* silent */
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="page animate-slide-up">
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-3)" }}>
        <div>
          <p className="section-label" style={{ marginBottom: "0.25rem" }}>NOTIFICATIONS</p>
          <p className="caption">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up 🎉"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-1)" }}>
          <button
            className="btn btn-small"
            onClick={() => setShowAll(!showAll)}
            style={{ fontSize: "var(--text-caption)" }}
            id="btn-toggle-all"
          >
            {showAll ? "Unread only" : "Show all"}
          </button>
          {unreadCount > 0 && (
            <button
              className="btn btn-small btn-primary"
              onClick={markAllRead}
              style={{ fontSize: "var(--text-caption)", display: "flex", alignItems: "center", gap: "4px" }}
              id="btn-mark-all-read"
            >
              <CheckCheck size={14} /> Read all
            </button>
          )}
        </div>
      </div>

      {/* ── States ── */}
      {loading && (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-5)" }}>
          <p className="caption">Loading notifications…</p>
        </div>
      )}

      {error && (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-4)", borderColor: "var(--alert-red)" }}>
          <Info size={24} style={{ marginBottom: "var(--space-1)" }} />
          <p style={{ fontWeight: 600 }}>{error}</p>
          <button className="btn btn-small" onClick={fetchNotifications} style={{ marginTop: "var(--space-2)" }}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-5)" }}>
          <BellOff size={32} style={{ marginBottom: "var(--space-2)", opacity: 0.4 }} />
          <p style={{ fontWeight: 600 }}>No notifications</p>
          <p className="caption" style={{ marginTop: "0.25rem" }}>
            {showAll ? "Nothing here yet — keep tracking!" : "Switch to \"Show all\" to see past notifications"}
          </p>
        </div>
      )}

      {/* ── Notification List ── */}
      {!loading && !error && notifications.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          {notifications.map((n) => {
            const meta = TYPE_META[n.type] || { icon: <Bell size={18} />, accent: "var(--charcoal-grey)", label: n.type };
            return (
              <div
                key={n.id}
                className="card"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "var(--space-2)",
                  opacity: n.is_read ? 0.55 : 1,
                  borderLeft: `4px solid ${meta.accent}`,
                  cursor: n.is_read ? "default" : "pointer",
                  transition: "opacity 0.2s ease",
                }}
                onClick={() => !n.is_read && markRead(n.id)}
                id={`notif-${n.id}`}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: meta.accent,
                    color: "#fff",
                    borderRadius: "var(--radius)",
                    flexShrink: 0,
                    border: "var(--border)",
                  }}
                >
                  {meta.icon}
                </div>

                {/* Body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.125rem" }}>
                    <span
                      className="caption"
                      style={{
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: meta.accent,
                      }}
                    >
                      {meta.label}
                    </span>
                    <span className="caption">{timeAgo(n.created_at)}</span>
                  </div>
                  <p style={{ fontSize: "var(--text-body)", lineHeight: 1.45 }}>{n.message}</p>
                </div>

                {/* Unread dot */}
                {!n.is_read && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: meta.accent,
                      flexShrink: 0,
                      marginTop: 6,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

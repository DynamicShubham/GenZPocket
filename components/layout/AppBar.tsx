"use client";

import Link from "next/link";
import { Bell, User } from "lucide-react";

interface AppBarProps {
  title?: string;
  showNotif?: boolean;
  showProfile?: boolean;
}

export function AppBar({ title = "GENZPOCKET", showNotif = true, showProfile = true }: AppBarProps) {
  return (
    <header className="app-bar">
      <Link href="/dashboard" className="app-bar-logo">
        {title}
      </Link>
      <div className="app-bar-actions">
        {showNotif && (
          <Link href="/notifications" className="btn-icon" aria-label="Notifications">
            <Bell size={18} strokeWidth={2.5} />
          </Link>
        )}
        {showProfile && (
          <Link href="/profile" className="btn-icon" aria-label="Profile">
            <User size={18} strokeWidth={2.5} />
          </Link>
        )}
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { Bell, User, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

interface AppBarProps {
  title?: string;
  showNotif?: boolean;
  showProfile?: boolean;
}

export function AppBar({ title = "GENZPOCKET", showNotif = true, showProfile = true }: AppBarProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Check local storage or system preference on mount
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", newTheme);
  };

  return (
    <header className="app-bar">
      <Link href="/dashboard" className="app-bar-logo">
        {title}
      </Link>
      <div className="app-bar-actions">
        <button onClick={toggleTheme} className="btn-icon" aria-label="Toggle theme">
          {theme === "light" ? <Moon size={18} strokeWidth={2.5} /> : <Sun size={18} strokeWidth={2.5} />}
        </button>
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

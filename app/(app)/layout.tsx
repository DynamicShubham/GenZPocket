"use client";

import { useEffect, useRef } from "react";
import posthog from "posthog-js";
import { AppBar } from "@/components/layout/AppBar";
import { TabBar } from "@/components/layout/TabBar";
import { authClient } from "@/lib/auth-client";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    const user = session?.user;

    if (!user?.id) {
      identifiedUserId.current = null;
      return;
    }

    if (identifiedUserId.current === user.id) return;

    if (identifiedUserId.current) {
      posthog.reset();
    }

    posthog.identify(user.id, {
      email: user.email,
      name: user.name,
    });
    identifiedUserId.current = user.id;
  }, [session?.user?.email, session?.user?.id, session?.user?.name]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--paper-white)" }}>
      <AppBar />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <TabBar />
    </div>
  );
}

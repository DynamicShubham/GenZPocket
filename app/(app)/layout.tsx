import { AppBar } from "@/components/layout/AppBar";
import { TabBar } from "@/components/layout/TabBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
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

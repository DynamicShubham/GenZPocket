import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css";

/* ── Fonts are loaded via Google Fonts link tags below ── */
const spaceGroteskVar = "font-space-grotesk";
const interVar = "font-inter";
const ibmPlexMonoVar = "font-ibm-plex-mono";

export const metadata: Metadata = {
  title: "GenZPocket — Smart Expense Tracker for College Students",
  description:
    "GenZPocket helps college students track expenses effortlessly, set budgets, get AI-powered financial insights, and build healthy money habits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGroteskVar} ${interVar} ${ibmPlexMonoVar} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-paper-white text-ink-black">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HeySalad AI Agent",
  description: "Open-source AI platform for food businesses — agents, voice, payments, marketplace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

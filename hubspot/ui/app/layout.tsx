import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Leads — Datawhistl",
  description: "Lead database viewer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased min-h-screen bg-background"
        suppressHydrationWarning
      >
        <Header />
        {children}
      </body>
    </html>
  );
}

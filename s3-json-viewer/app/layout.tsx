import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import { PrinciplesProvider } from "@/lib/principles/PrinciplesContext";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Principles",
  description: "AI Principles dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <PrinciplesProvider>
          <Header />
          <div className="flex flex-1 min-h-0">
            <Sidebar />
            <main className="flex-1 min-w-0 overflow-auto p-6">{children}</main>
          </div>
          <Footer />
        </PrinciplesProvider>
      </body>
    </html>
  );
}

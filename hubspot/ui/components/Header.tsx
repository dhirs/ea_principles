"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  // No chrome on the login screen.
  if (pathname === "/login") return null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-16 bg-card flex items-center px-8 sticky top-0 z-30 shadow-md">
      <Link
        href="/"
        aria-label="Home"
        className="inline-flex items-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Image
          src="/img/logo.png"
          alt="AI Principles"
          width={140}
          height={36}
          priority
          className="h-9 w-auto"
        />
      </Link>
      <div className="flex-1" />
      <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground">
        <LogOut className="h-4 w-4" /> Log out
      </Button>
    </header>
  );
}

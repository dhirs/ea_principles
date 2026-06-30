import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Client Login — Aegis",
  description: "Sign in to the Aegis client dashboard.",
};

export default function LoginPage() {
  return (
    // Full-bleed overlay so the dashboard chrome (header/sidebar/footer) is hidden.
    <div className="fixed inset-0 z-50 grid bg-background lg:grid-cols-2">
      {/* Left — brand art */}
      <div className="relative hidden overflow-hidden lg:block">
        {/* webp art; drop a file at /public/img/login.webp. Falls back to gradient. */}
        <div className="absolute inset-0 bg-[url('/img/login.webp')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/85 to-indigo-950/90 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.png" alt="Aegis" className="h-9 w-auto brightness-0 invert" />
            <span className="text-lg font-semibold tracking-tight">Aegis</span>
          </div>

          <div className="max-w-md">
            <h2 className="text-6xl font-semibold leading-tight tracking-tight">
              Enterprise Architecture Standards.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Standards, reference implementations and framework mappings across
              every domain — in one place.
            </p>
          </div>

          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} Aegis · Datawhistl
          </p>
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.png" alt="Aegis" className="h-9 w-auto" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Client Login
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with your registered email and password.
          </p>

          <Suspense><LoginForm /></Suspense>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Access is provisioned for approved clients. Need access?{" "}
            <a
              href="mailto:hello@datawhistl.com"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Contact us
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

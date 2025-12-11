"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function ConditionalHeader() {
  const pathname = usePathname();

  // Show header only on login and registration pages
  const showHeader = pathname === "/login" || pathname.startsWith("/register");

  if (!showHeader) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-primary/20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <Logo size="md" />
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-bold uppercase tracking-wider text-primary">
              Digital Library Management System
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/register/student"
            className="text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            Register
          </Link>
          <Link
            href="/login"
            className="rounded-md border-2 border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}

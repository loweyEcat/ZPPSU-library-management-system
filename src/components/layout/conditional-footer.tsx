"use client";

import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";

export function ConditionalFooter() {
  const pathname = usePathname();
  
  // Show footer only on login and registration pages
  const showFooter = pathname === "/login" || pathname.startsWith("/register");
  
  if (!showFooter) {
    return null;
  }

  return (
    <footer className="mt-auto border-t-2 border-primary/20 bg-white/50 py-8">
      <div className="container px-4">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <Logo size="sm" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Library Management System. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}


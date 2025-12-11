import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

import { cn } from "@/lib/utils";
import { ConditionalHeader } from "@/components/layout/conditional-header";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Digital Library Management System",
  description:
    "Digital Library Management System for managing books, documents, and resources",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="light">
      <body
        className={cn(
          "flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-yellow-50 font-sans text-foreground antialiased",
          geistSans.variable,
          geistMono.variable
        )}
      >
        <ConditionalHeader />
        <main className="flex-1">{children}</main>
        <ConditionalFooter />
        <Toaster />
      </body>
    </html>
  );
}

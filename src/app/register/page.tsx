import type { Metadata } from "next";
import Link from "next/link";

import { SuperAdminRegistrationForm } from "@/components/forms/super-admin-registration-form";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Register | Library Management System",
  description:
    "Create the Super Admin account for the Library Management System",
};

export default async function RegisterPage() {
  // Check if super admin already exists
  const existingSuperAdmin = await prisma.lib_users.findFirst({
    where: { user_role: "Super_Admin" },
    select: { id: true },
  });

  if (existingSuperAdmin) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-4 py-16 sm:px-6">
        <div className="space-y-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Super Admin Already Exists
              </h1>
              <p className="text-sm text-muted-foreground">
                A Super Admin account has already been created. Please login
                instead.
              </p>
            </div>
          </div>
          <Button asChild className="w-full">
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="space-y-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Library Management System
            </h1>
            <p className="text-sm text-muted-foreground">
              Create the first Super Admin account to get started
            </p>
          </div>
        </div>
      </div>
      <div className="mt-10">
        <SuperAdminRegistrationForm />
      </div>
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

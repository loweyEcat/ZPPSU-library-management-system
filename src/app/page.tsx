import { redirect } from "next/navigation";
import Link from "next/link";

import { getCurrentSession } from "@/lib/auth-library";
import { SuperAdminRegistrationForm } from "@/components/forms/super-admin-registration-form";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await getCurrentSession();

  if (session) {
    // Redirect based on user role
    if (
      session.user.userRole === "Super_Admin" ||
      session.user.userRole === "Admin"
    ) {
      redirect("/admin");
    }
    if (session.user.userRole === "Staff") {
      redirect("/staff");
    }
    redirect("/student");
  }

  // Check if super admin exists

  const existingSuperAdmin = await prisma.lib_users.findFirst({
    where: { user_role: "Super_Admin" },
    select: { id: true },
  });

  // If super admin already exists, redirect to login
  if (existingSuperAdmin) {
    redirect("/login");
  }

  // Show registration form on the home page
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="space-y-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Digital Library Management System
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

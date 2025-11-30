import type { Metadata } from "next";
import Link from "next/link";

import { StudentRegistrationForm } from "@/components/forms/student-registration-form";
import { Button } from "@/components/ui/button";
import { getCurrentSession } from "@/lib/auth-library";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Student Registration | Library Management System",
  description: "Register as a student to access the Library Management System",
};

export default async function StudentRegisterPage() {
  const session = await getCurrentSession();
  if (session) {
    // Redirect based on user role
    if (session.user.userRole === "Super_Admin" || session.user.userRole === "Admin") {
      redirect("/admin");
    }
    if (session.user.userRole === "Staff") {
      redirect("/dashboard/staff");
    }
    if (session.user.userRole === "Student") {
      redirect("/dashboard/student");
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col justify-center px-4 py-16 sm:px-6">
      <div className="space-y-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Library Management System
            </h1>
            <p className="text-sm text-muted-foreground">
              Register as a student to get started
            </p>
          </div>
        </div>
      </div>
      <div className="mt-10">
        <StudentRegistrationForm />
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


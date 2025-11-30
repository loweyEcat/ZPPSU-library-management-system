import { redirect } from "next/navigation";
import Link from "next/link";

import { getCurrentSession } from "@/lib/auth-library";
import { LibraryLoginForm } from "@/components/forms/library-login-form";

export const metadata = {
  title: "Login | Library Management System",
  description: "Sign in to the Library Management System",
};

export default async function LoginPage() {
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
    redirect("/dashboard/student");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="space-y-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Library Management System</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to access the library management portal
            </p>
          </div>
        </div>
      </div>
      <div className="mt-10">
        <LibraryLoginForm />
      </div>
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register/student" className="text-primary hover:underline">
            Register as Student
          </Link>
        </p>
      </div>
    </div>
  );
}

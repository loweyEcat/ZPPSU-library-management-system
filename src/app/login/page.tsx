import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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
    if (
      session.user.userRole === "Super_Admin" ||
      session.user.userRole === "Admin"
    ) {
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
    <div className="relative min-h-screen w-full">
      {/* Background Image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/bg-login.jpeg"
          alt="ZPPSU Campus Background"
          fill
          className="object-cover"
          priority
          quality={85}
        />
        {/* Dark overlay for better readability */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-white/20 bg-white/10 p-10 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
          <div className="space-y-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-lg sm:text-3xl">
                  Library Management System
                </h1>
                <p className="text-sm text-white/90 drop-shadow-md">
                  Sign in to access the library management portal
                </p>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <LibraryLoginForm />
          </div>
          <div className="mt-6 text-center">
            <p className="text-sm text-white/90 drop-shadow-md">
              Don&apos;t have an account?{" "}
              <Link
                href="/register/student"
                className="font-medium text-white underline decoration-white/50 underline-offset-2 hover:text-white hover:decoration-white"
              >
                Register as Student
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

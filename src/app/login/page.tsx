import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { getCurrentSession } from "@/lib/auth-library";
import { LibraryLoginForm } from "@/components/forms/library-login-form";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Login | Digital Library Management System",
  description: "Sign in to the Digital Library Management System",
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
      <div className="absolute inset-0 -z-10 bg-center">
        <Image
          src="/images/bg-login.jpeg"
          alt="ZPPSU Campus Background"
          fill
          className="object-cover"
          priority
          quality={85}
        />
        {/* Dark overlay for better readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-2xl sm:rounded-3xl border border-white/20 bg-white/10 p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
          {/* Header Section - Responsive Layout */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            {/* Mobile: Logos side by side, Desktop: Logo on left */}
            <div className="flex sm:block items-center justify-center gap-3 sm:gap-0 w-full sm:w-auto sm:flex-shrink-0">
              {/* ZPPSU Logo */}
              <div className="flex-shrink-0 bg-white rounded-full p-1 sm:p-2">
                <Image
                  src="/images/logo.png"
                  alt="ZPPSU Logo"
                  width={80}
                  height={80}
                  className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain"
                  priority
                />
              </div>

              {/* Library Logo - Only visible on mobile, inline with ZPPSU logo */}
              <div className="flex-shrink-0 bg-white rounded-full p-1 sm:hidden">
                <Image
                  src="/images/library-logo.png"
                  alt="Library Logo"
                  width={80}
                  height={80}
                  className="w-16 h-16 object-contain"
                  priority
                />
              </div>
            </div>

            {/* Title Section - Center on mobile, between logos on desktop */}
            <div className="flex flex-col items-center sm:gap-4 text-center flex-1 px-2 sm:p-4">
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-primary drop-shadow-lg">
                  Digital Library Management System
                </h1>
                <Separator className="bg-primary w-full" />
                <p className="text-xs sm:text-sm text-white drop-shadow-md">
                  Sign in to access the digital library management portal
                </p>
              </div>
            </div>

            {/* Library Logo - Only visible on desktop, on the right */}
            <div className="hidden sm:block flex-shrink-0 bg-white rounded-full  sm:p-2">
              <Image
                src="/images/library-logo.png"
                alt="Library Logo"
                width={80}
                height={80}
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain"
                priority
              />
            </div>
          </div>
          {/* Login Form */}
          <div className="mt-6 sm:mt-8 border-2 border-white/20 rounded-lg p-4 sm:p-6">
            <LibraryLoginForm />
          </div>

          {/* Registration Link */}
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm text-white/90 drop-shadow-md">
              Don&apos;t have an account?{" "}
              <Link
                href="/register/student"
                className="font-medium text-white underline decoration-white/50 underline-offset-2 hover:text-white hover:decoration-white transition-colors"
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

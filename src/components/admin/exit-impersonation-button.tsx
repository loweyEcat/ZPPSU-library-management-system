"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { checkImpersonationStatus } from "@/app/admin/users/actions";

export function ExitImpersonationButton() {
  const router = useRouter();
  const [isExiting, setIsExiting] = React.useState(false);
  const [isImpersonating, setIsImpersonating] = React.useState(false);

  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await checkImpersonationStatus();
        setIsImpersonating(status.isImpersonating);
      } catch (error) {
        // Silently fail - don't show button if check fails
        setIsImpersonating(false);
      }
    };

    checkStatus();
    // Check periodically (less frequent to avoid unnecessary requests)
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleExitImpersonation = async () => {
    if (isExiting) return;

    setIsExiting(true);
    try {
      const response = await fetch("/api/library/exit-impersonation", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to exit impersonation.");
        setIsExiting(false);
        return;
      }

      // Redirect to the admin dashboard
      router.push(data.redirectUrl || "/admin");
      router.refresh();
    } catch (error) {
      console.error("Exit impersonation error:", error);
      alert("An error occurred while exiting impersonation.");
      setIsExiting(false);
    }
  };

  if (!isImpersonating) {
    return null;
  }

  return (
    <Button
      onClick={handleExitImpersonation}
      disabled={isExiting}
      variant="outline"
      className="w-full justify-start bg-[hsl(340,55%,20%)] text-[hsl(45,100%,90%)] border-[hsl(340,55%,20%)] hover:bg-[hsl(45,100%,55%)] hover:text-[hsl(340,60%,15%)] hover:border-[hsl(45,100%,55%)] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isExiting ? "Exiting..." : "Exit Impersonation"}
    </Button>
  );
}

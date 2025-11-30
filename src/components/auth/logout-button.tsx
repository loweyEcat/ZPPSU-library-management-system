"use client";

import * as React from "react";
import { AlertCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type LogoutButtonProps = {
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  label?: string;
};

export function LogoutButton({
  variant = "outline",
  size = "sm",
  className,
  label = "Sign out",
}: LogoutButtonProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const requestRef = React.useRef<AbortController | null>(null);

  const closeDialog = React.useCallback(() => {
    setIsDialogOpen(false);
    setError(null);
  }, []);

  const submitLogout = React.useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/library/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.message ?? "Unable to sign out. Please try again.");
        setIsLoading(false);
        return;
      }

      closeDialog();
      router.replace("/login");
      router.refresh();
    } catch (cause) {
      if ((cause as DOMException | undefined)?.name === "AbortError") {
        setIsLoading(false);
        return;
      }
      setError("Network error while signing out. Please retry.");
      setIsLoading(false);
    }
  }, [closeDialog, router]);

  React.useEffect(() => {
    return () => {
      requestRef.current?.abort();
    };
  }, []);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (isLoading) {
        return;
      }

      setIsDialogOpen(nextOpen);
      if (!nextOpen) {
        setError(null);
      }
    },
    [isLoading],
  );

  const handleClick = React.useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleConfirm = React.useCallback(() => {
    void submitLogout();
  }, [submitLogout]);

  return (
    <div className={className}>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={isLoading}
        aria-haspopup="dialog"
        aria-expanded={isDialogOpen}
        className="gap-2"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        <span>{label}</span>
      </Button>
      <AlertDialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent
          aria-busy={isLoading}
          className="space-y-4"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out from your account?</AlertDialogTitle>
            <AlertDialogDescription>
              We will end your authenticated session and redirect you to the
              login screen. Make sure you have saved any ongoing work before
              continuing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <Alert
              variant="destructive"
              className="gap-3"
            >
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <div>
                <AlertTitle>We could not complete the sign out</AlertTitle>
                <AlertDescription>
                  {error}
                </AlertDescription>
              </div>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Stay signed in</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleConfirm();
              }}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  <span>Signing out…</span>
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Sign out</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


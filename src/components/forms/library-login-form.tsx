"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const loginFormSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LibraryLoginForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = React.useCallback(
    async (values: LoginFormValues) => {
      setError(null);
      setIsSubmitting(true);

      try {
        const response = await fetch("/api/library/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({
            message: "Unable to login. Check your credentials and try again.",
          }));
          setError(
            errorBody.message ??
              "Unable to login. Check your credentials and try again."
          );
          setIsSubmitting(false);
          return;
        }

        const result = await response.json().catch(() => null);

        if (!result?.user) {
          router.replace("/");
          router.refresh();
          return;
        }

        // Redirect based on user role
        const nextRoute = (() => {
          if (
            result.user.userRole === "Super_Admin" ||
            result.user.userRole === "Admin"
          ) {
            return "/admin";
          }
          if (result.user.userRole === "Staff") {
            return "/dashboard/staff";
          }
          if (result.user.userRole === "Student") {
            return "/dashboard/student";
          }
          return "/dashboard/student";
        })();

        router.replace(nextRoute);
        router.refresh();
      } catch (cause) {
        setError("Network error while signing in. Please retry.");
        setIsSubmitting(false);
      }
    },
    [router]
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 rounded-xl border border-border bg-card/60 p-8 shadow-lg shadow-black/5 backdrop-blur"
      >
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Library Management System</h2>
          <p className="text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <p className="rounded-lg border border-destructive/60 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing In…
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>
    </Form>
  );
}

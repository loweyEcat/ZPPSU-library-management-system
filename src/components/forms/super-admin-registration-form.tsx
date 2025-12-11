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

const registrationFormSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(150, "Full name must not exceed 150 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must not exceed 100 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
    contactNumber: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegistrationFormValues = z.infer<typeof registrationFormSchema>;

export function SuperAdminRegistrationForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      contactNumber: "",
    },
  });

  const onSubmit = React.useCallback(
    async (values: RegistrationFormValues) => {
      setError(null);
      setIsSubmitting(true);

      try {
        const response = await fetch("/api/library/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName: values.fullName,
            email: values.email,
            password: values.password,
            confirmPassword: values.confirmPassword,
            contactNumber: values.contactNumber || undefined,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({
            message: "Failed to create account. Please try again.",
          }));
          setError(errorBody.message ?? "Failed to create account. Please try again.");
          setIsSubmitting(false);
          return;
        }

        const result = await response.json().catch(() => null);

        if (result?.message) {
          // Redirect to login page after successful registration
          router.push("/login?registered=true");
        } else {
          setError("Registration completed but something went wrong. Please try logging in.");
          setIsSubmitting(false);
        }
      } catch (cause) {
        setError("Network error while registering. Please retry.");
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
          <h2 className="text-2xl font-bold">Create Super Admin Account</h2>
          <p className="text-sm text-muted-foreground">
            Create the first administrator account for the Digital Library Management System
          </p>
        </div>

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="John Doe"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  placeholder="admin@library.edu"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Number (Optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="tel"
                  placeholder="+1234567890"
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
                  autoComplete="new-password"
                  placeholder="Enter a strong password"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm your password"
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

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account…
            </>
          ) : (
            "Create Super Admin Account"
          )}
        </Button>
      </form>
    </Form>
  );
}


"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  User,
  Mail,
  Phone,
  Briefcase,
  Lock,
  AlertCircle,
  GraduationCap,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const staffRegistrationFormSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .min(2, "First name must be at least 2 characters")
      .max(75, "First name must not exceed 75 characters")
      .regex(
        /^[a-zA-Z\s'-]+$/,
        "First name can only contain letters, spaces, hyphens, and apostrophes"
      ),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .min(2, "Last name must be at least 2 characters")
      .max(75, "Last name must not exceed 75 characters")
      .regex(
        /^[a-zA-Z\s'-]+$/,
        "Last name can only contain letters, spaces, hyphens, and apostrophes"
      ),
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
    staffCategory: z
      .enum(["Intern", "Working_Student", "Regular_Employee"])
      .optional(),
    assignedRole: z
      .string()
      .max(100, "Assigned role must not exceed 100 characters")
      .optional(),
    studentId: z
      .string()
      .max(50, "Student ID must not exceed 50 characters")
      .optional(),
    section: z
      .string()
      .max(50, "Section must not exceed 50 characters")
      .optional(),
    department: z
      .string()
      .max(100, "Department must not exceed 100 characters")
      .optional(),
    yearLevel: z
      .string()
      .max(50, "Year level must not exceed 50 characters")
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      // If staff category is Intern or Working_Student, student fields are required
      if (
        data.staffCategory === "Intern" ||
        data.staffCategory === "Working_Student"
      ) {
        return (
          data.studentId &&
          data.studentId.trim().length > 0 &&
          data.section &&
          data.section.trim().length > 0 &&
          data.department &&
          data.department.trim().length > 0 &&
          data.yearLevel &&
          data.yearLevel.trim().length > 0
        );
      }
      return true;
    },
    {
      message:
        "Student ID, Section, Department, and Year Level are required for Intern and Working Student",
      path: ["studentId"],
    }
  );

type StaffRegistrationFormValues = z.infer<typeof staffRegistrationFormSchema>;

interface StaffRegistrationFormProps {
  onSuccess?: () => void;
}

export function StaffRegistrationForm({
  onSuccess,
}: StaffRegistrationFormProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<StaffRegistrationFormValues>({
    resolver: zodResolver(staffRegistrationFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      contactNumber: "",
      staffCategory: undefined,
      assignedRole: "",
      studentId: "",
      section: "",
      department: "",
      yearLevel: "",
    },
  });

  // Watch staffCategory to conditionally show/hide student fields
  const staffCategory = form.watch("staffCategory");
  const showStudentFields =
    staffCategory === "Intern" || staffCategory === "Working_Student";

  const onSubmit = React.useCallback(
    async (values: StaffRegistrationFormValues) => {
      setError(null);
      setIsSubmitting(true);

      // Determine if student fields should be sent based on the submitted values
      const isInternOrWorkingStudent =
        values.staffCategory === "Intern" ||
        values.staffCategory === "Working_Student";

      try {
        const response = await fetch("/api/library/staff/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            password: values.password,
            confirmPassword: values.confirmPassword,
            contactNumber: values.contactNumber || undefined,
            staffCategory: values.staffCategory || undefined,
            assignedRole: values.assignedRole || undefined,
            studentId: isInternOrWorkingStudent
              ? values.studentId || undefined
              : undefined,
            section: isInternOrWorkingStudent
              ? values.section || undefined
              : undefined,
            department: isInternOrWorkingStudent
              ? values.department || undefined
              : undefined,
            yearLevel: isInternOrWorkingStudent
              ? values.yearLevel || undefined
              : undefined,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({
            message: "Failed to create staff account. Please try again.",
          }));
          setError(
            errorBody.message ??
              "Failed to create staff account. Please try again."
          );
          setIsSubmitting(false);
          return;
        }

        const result = await response.json().catch(() => null);

        if (result?.message) {
          form.reset();
          if (onSuccess) {
            onSuccess();
          }
        } else {
          setError("Registration completed but something went wrong.");
          setIsSubmitting(false);
        }
      } catch (cause) {
        setError("Network error while registering. Please retry.");
        setIsSubmitting(false);
      }
    },
    [form, onSuccess]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Personal Information
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">First Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="John"
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Last Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Doe"
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  Email Address *
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    placeholder="staff@library.edu"
                    disabled={isSubmitting}
                    className="h-11"
                  />
                </FormControl>
                <FormDescription>
                  This will be used for login and account notifications.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  Contact Number
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    disabled={isSubmitting}
                    className="h-11"
                  />
                </FormControl>
                <FormDescription>
                  Optional. Include country code for international numbers.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Staff Details Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Staff Details
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="staffCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Staff Category</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Clear student fields when category changes to Regular_Employee
                      if (value === "Regular_Employee") {
                        form.setValue("studentId", "");
                        form.setValue("section", "");
                        form.setValue("department", "");
                        form.setValue("yearLevel", "");
                      }
                    }}
                    value={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Intern">Intern</SelectItem>
                      <SelectItem value="Working_Student">
                        Working Student
                      </SelectItem>
                      <SelectItem value="Regular_Employee">
                        Regular Employee
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Optional. Select the staff member's employment type.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignedRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Assigned Role</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Librarian, Cataloger"
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. Specify the staff member's primary role or task.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Student Information Fields - Only shown for Intern and Working Student */}
          {showStudentFields && (
            <>
              <Separator className="my-4" />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Student Information
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">
                        Student ID *
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., 2024-12345"
                          disabled={isSubmitting}
                          className="h-11"
                        />
                      </FormControl>
                      <FormDescription>
                        Required for Intern and Working Student staff members.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="section"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Section *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., A, B, C"
                            disabled={isSubmitting}
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="yearLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">
                          Year Level *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., 1st Year, 2nd Year"
                            disabled={isSubmitting}
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">
                        Department *
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Computer Science, Engineering"
                          disabled={isSubmitting}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Account Security Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Account Security
            </h3>
          </div>

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Password *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Enter a strong password"
                    disabled={isSubmitting}
                    className="h-11"
                  />
                </FormControl>
                <FormDescription>
                  Must be at least 8 characters with uppercase, lowercase, and a
                  number.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">
                  Confirm Password *
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    disabled={isSubmitting}
                    className="h-11"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => form.reset()}
            disabled={isSubmitting}
          >
            Clear Form
          </Button>
          <Button
            type="submit"
            className="w-full sm:flex-1"
            disabled={isSubmitting}
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account…
              </>
            ) : (
              <>
                <User className="mr-2 h-4 w-4" />
                Create Staff Account
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

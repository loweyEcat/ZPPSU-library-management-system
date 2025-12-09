"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, Eye, EyeOff } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const studentRegistrationFormSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(75, "First name must not exceed 75 characters"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(75, "Last name must not exceed 75 characters"),
    email: z.string().email("Invalid email address"),
    contactNumber: z.string().min(1, "Contact number is required"),
    sex: z.enum(["Male", "Female", "Other"]),
    studentId: z.string().min(1, "Student ID is required").max(50, "Student ID must not exceed 50 characters"),
    section: z.string().min(1, "Section is required").max(50, "Section must not exceed 50 characters"),
    department: z.string().min(1, "Department is required").max(100, "Department must not exceed 100 characters"),
    yearLevel: z.string().min(1, "Year level is required").max(50, "Year level must not exceed 50 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must not exceed 100 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
    schoolIdFile: z.instanceof(File).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type StudentRegistrationFormValues = z.infer<typeof studentRegistrationFormSchema>;

export function StudentRegistrationForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadingFile, setUploadingFile] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const form = useForm<StudentRegistrationFormValues>({
    resolver: zodResolver(studentRegistrationFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      contactNumber: "",
      sex: undefined,
      studentId: "",
      section: "",
      department: "",
      yearLevel: "",
      password: "",
      confirmPassword: "",
      schoolIdFile: undefined,
    },
  });

  const onSubmit = React.useCallback(
    async (values: StudentRegistrationFormValues) => {
      setError(null);
      setIsSubmitting(true);

      try {
        let schoolIdUrl: string | undefined = undefined;

        // Upload school ID file if provided
        if (values.schoolIdFile) {
          setUploadingFile(true);
          const formData = new FormData();
          formData.append("file", values.schoolIdFile);
          formData.append("folder", "school_ids");

          const uploadResponse = await fetch("/api/upload/school-id", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorBody = await uploadResponse.json().catch(() => ({
              message: "Failed to upload school ID. Please try again.",
            }));
            setError(errorBody.message ?? "Failed to upload school ID. Please try again.");
            setIsSubmitting(false);
            setUploadingFile(false);
            return;
          }

          const uploadResult = await uploadResponse.json();
          schoolIdUrl = uploadResult.url;
          setUploadingFile(false);
        }

        const response = await fetch("/api/library/student/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: values.firstName,
            lastName: values.lastName,
            fullName: `${values.firstName} ${values.lastName}`,
            email: values.email,
            contactNumber: values.contactNumber,
            sex: values.sex,
            studentId: values.studentId,
            section: values.section,
            department: values.department,
            yearLevel: values.yearLevel,
            password: values.password,
            confirmPassword: values.confirmPassword,
            uploadedSchoolId: schoolIdUrl,
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
        className="space-y-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white drop-shadow-md">First Name *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="John"
                    disabled={isSubmitting}
                    className="bg-white/90 backdrop-blur-sm border-white/30"
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
                <FormLabel className="text-white drop-shadow-md">Last Name *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Doe"
                    disabled={isSubmitting}
                    className="bg-white/90 backdrop-blur-sm border-white/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white drop-shadow-md">Email *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    placeholder="student@example.com"
                    disabled={isSubmitting}
                    className="bg-white/90 backdrop-blur-sm border-white/30"
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
                <FormLabel className="text-white drop-shadow-md">Contact Number *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="tel"
                    placeholder="+1234567890"
                    disabled={isSubmitting}
                    className="bg-white/90 backdrop-blur-sm border-white/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="sex"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white drop-shadow-md">Sex *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger className="bg-white/90 backdrop-blur-sm border-white/30">
                    <SelectValue placeholder="Select sex" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white drop-shadow-md">Student ID *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="2024-00123"
                  disabled={isSubmitting}
                  className="bg-white/90 backdrop-blur-sm border-white/30"
                />
              </FormControl>
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
                <FormLabel className="text-white drop-shadow-md">Section *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="A"
                    disabled={isSubmitting}
                    className="bg-white/90 backdrop-blur-sm border-white/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white drop-shadow-md">Department *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Computer Science"
                    disabled={isSubmitting}
                    className="bg-white/90 backdrop-blur-sm border-white/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="yearLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white drop-shadow-md">Year Level *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="1st Year"
                  disabled={isSubmitting}
                  className="bg-white/90 backdrop-blur-sm border-white/30"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="schoolIdFile"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel className="text-white drop-shadow-md">Upload School ID</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    {...fieldProps}
                    type="file"
                    accept="image/*,.pdf"
                    disabled={isSubmitting}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        onChange(file);
                      }
                    }}
                    className="cursor-pointer bg-white/90 backdrop-blur-sm border-white/30"
                  />
                  {value && (
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {value.name}
                    </span>
                  )}
                </div>
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
              <FormLabel className="text-white drop-shadow-md">Password *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter a strong password"
                    disabled={isSubmitting}
                    className="bg-white/90 backdrop-blur-sm border-white/30 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none disabled:opacity-50"
                    disabled={isSubmitting}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
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
              <FormLabel className="text-white drop-shadow-md">Confirm Password *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    disabled={isSubmitting}
                    className="bg-white/90 backdrop-blur-sm border-white/30 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none disabled:opacity-50"
                    disabled={isSubmitting}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
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

        <Button type="submit" className="w-full" disabled={isSubmitting || uploadingFile}>
          {(isSubmitting || uploadingFile) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {uploadingFile ? "Uploading..." : "Creating Account…"}
            </>
          ) : (
            "Create Student Account"
          )}
        </Button>
      </form>
    </Form>
  );
}


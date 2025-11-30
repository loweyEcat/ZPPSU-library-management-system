"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, RotateCcw, Power } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
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

const editUserSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(75, "First name must not exceed 75 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(75, "Last name must not exceed 75 characters"),
  email: z.string().email("Invalid email address"),
  contactNumber: z.string().max(50).optional().nullable(),
  staffCategory: z
    .enum(["Intern", "Working_Student", "Regular_Employee"])
    .optional()
    .nullable(),
  assignedRole: z.string().max(100).optional().nullable(),
  yearLevel: z.string().max(50).optional().nullable(),
  section: z.string().max(50).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  status: z.enum(["Active", "Inactive", "Suspended"]),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number | null;
  userRole: "Super_Admin" | "Admin" | "Staff" | "Student";
  initialData?: {
    fullName: string;
    email: string;
    contactNumber: string | null;
    staffCategory: string | null;
    assignedRole: string | null;
    yearLevel: string | null;
    section: string | null;
    department: string | null;
    status: "Active" | "Inactive" | "Suspended";
  };
}

export function EditUserDialog({
  open,
  onOpenChange,
  userId,
  userRole,
  initialData,
}: EditUserDialogProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = React.useState(false);
  const [showResetDialog, setShowResetDialog] = React.useState(false);
  const [showToggleStatusDialog, setShowToggleStatusDialog] =
    React.useState(false);

  // Helper function to split full name into first and last name
  const splitFullName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: "" };
    }
    const lastName = parts.pop() || "";
    const firstName = parts.join(" ");
    return { firstName, lastName };
  };

  const { firstName: initialFirstName, lastName: initialLastName } =
    initialData?.fullName
      ? splitFullName(initialData.fullName)
      : { firstName: "", lastName: "" };

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: initialFirstName,
      lastName: initialLastName,
      email: initialData?.email || "",
      contactNumber: initialData?.contactNumber || "",
      staffCategory:
        (initialData?.staffCategory as
          | "Intern"
          | "Working_Student"
          | "Regular_Employee") || null,
      assignedRole: initialData?.assignedRole || "",
      yearLevel: initialData?.yearLevel || "",
      section: initialData?.section || "",
      department: initialData?.department || "",
      status: initialData?.status || "Active",
    },
  });

  React.useEffect(() => {
    if (initialData) {
      const { firstName, lastName } = splitFullName(initialData.fullName);
      form.reset({
        firstName,
        lastName,
        email: initialData.email,
        contactNumber: initialData.contactNumber || "",
        staffCategory:
          (initialData.staffCategory as
            | "Intern"
            | "Working_Student"
            | "Regular_Employee") || null,
        assignedRole: initialData.assignedRole || "",
        yearLevel: initialData.yearLevel || "",
        section: initialData.section || "",
        department: initialData.department || "",
        status: initialData.status,
      });
    }
  }, [initialData, form]);

  const onSubmit = async (values: EditUserFormValues) => {
    if (!userId) return;

    setIsUpdating(true);

    // Combine firstName and lastName into fullName for API (database expects full_name)
    const fullName =
      `${values.firstName.trim()} ${values.lastName.trim()}`.trim();

    try {
      const response = await fetch(`/api/library/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          fullName, // Send combined name to API
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to update user.");
        setIsUpdating(false);
        return;
      }

      toast.success("User updated successfully.");
      setIsUpdating(false);
      setTimeout(() => {
        onOpenChange(false);
        router.refresh();
      }, 1000);
    } catch (error) {
      toast.error("Network error while updating. Please retry.");
      setIsUpdating(false);
    }
  };

  const handleReset = () => {
    setShowResetDialog(true);
  };

  const confirmReset = async () => {
    if (!userId) return;
    setShowResetDialog(false);
    setIsResetting(true);

    try {
      const response = await fetch(`/api/library/users/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "reset" }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to reset user information.");
        setIsResetting(false);
        return;
      }

      toast.success("User information reset successfully.");
      setIsResetting(false);
      setTimeout(() => {
        onOpenChange(false);
        router.refresh();
      }, 1000);
    } catch (error) {
      toast.error("Network error while resetting. Please retry.");
      setIsResetting(false);
    }
  };

  const handleToggleStatus = () => {
    setShowToggleStatusDialog(true);
  };

  const confirmToggleStatus = async () => {
    if (!userId) return;
    setShowToggleStatusDialog(false);
    setIsTogglingStatus(true);

    try {
      const response = await fetch(`/api/library/users/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "toggle-status" }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to toggle user status.");
        setIsTogglingStatus(false);
        return;
      }

      form.setValue("status", data.status);
      toast.success(
        `User ${
          data.status === "Active" ? "activated" : "deactivated"
        } successfully.`
      );
      setIsTogglingStatus(false);
      router.refresh();
    } catch (error) {
      toast.error("Network error while toggling status. Please retry.");
      setIsTogglingStatus(false);
    }
  };

  if (!userId || !initialData) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit User</DialogTitle>
          <DialogDescription className="text-base">
            Update user information and manage account status.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">First Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        disabled={isUpdating}
                        className="h-11"
                        placeholder="Enter first name"
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
                    <FormLabel className="font-semibold">Last Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        disabled={isUpdating}
                        className="h-11"
                        placeholder="Enter last name"
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
                  <FormLabel className="font-semibold">Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      disabled={isUpdating}
                      className="h-11"
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
                  <FormLabel className="font-semibold">
                    Contact Number
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      disabled={isUpdating}
                      className="h-11"
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {userRole === "Staff" || userRole === "Admin" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="staffCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">
                        Staff Category
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                        disabled={isUpdating}
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">
                        Assigned Role
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isUpdating}
                          placeholder="e.g., Librarian"
                          className="h-11"
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : userRole === "Student" ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="yearLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">
                          Year Level
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isUpdating}
                            className="h-11"
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="section"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Section</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isUpdating}
                            className="h-11"
                            value={field.value || ""}
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
                      <FormLabel className="font-semibold">
                        Department
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isUpdating}
                          className="h-11"
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : null}

            {/* <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isUpdating}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

            <Separator className="my-6" />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isResetting || isUpdating || isTogglingStatus}
                  className="h-11"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset Info
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant={
                    form.watch("status") === "Active"
                      ? "destructive"
                      : "default"
                  }
                  onClick={handleToggleStatus}
                  disabled={isTogglingStatus || isUpdating || isResetting}
                  className="h-11"
                >
                  {isTogglingStatus ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Power className="mr-2 h-4 w-4" />
                      {form.watch("status") === "Active"
                        ? "Deactivate"
                        : "Activate"}
                    </>
                  )}
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isUpdating || isResetting || isTogglingStatus}
                  className="h-11"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating || isResetting || isTogglingStatus}
                  className="h-11"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update User"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>

        {/* Reset Confirmation Dialog */}
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset User Information</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reset this user's personal information?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmReset}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Toggle Status Confirmation Dialog */}
        <AlertDialog
          open={showToggleStatusDialog}
          onOpenChange={setShowToggleStatusDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {form.watch("status") === "Active" ? "Deactivate" : "Activate"}{" "}
                User Account
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to{" "}
                {form.watch("status") === "Active" ? "deactivate" : "activate"}{" "}
                this user's account?
                {form.watch("status") === "Active" &&
                  " The user will not be able to log in."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmToggleStatus}
                className={
                  form.watch("status") === "Active"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : ""
                }
              >
                {form.watch("status") === "Active" ? "Deactivate" : "Activate"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

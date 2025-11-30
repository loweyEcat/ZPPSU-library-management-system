"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, User, Mail, Phone, Briefcase } from "lucide-react";
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

const editStaffSchema = z.object({
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
  contactNumber: z.string().max(50).optional().nullable(),
  staffCategory: z
    .enum(["Intern", "Working_Student", "Regular_Employee"])
    .optional()
    .nullable(),
  assignedRole: z.string().max(100).optional().nullable(),
  status: z.enum(["Active", "Inactive", "Suspended"]),
});

type EditStaffFormValues = z.infer<typeof editStaffSchema>;

interface EditStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: number | null;
  initialData?: {
    firstName: string;
    lastName: string;
    email: string;
    contactNumber: string | null;
    staffCategory: string | null;
    assignedRole: string | null;
    status: "Active" | "Inactive" | "Suspended";
  };
}

export function EditStaffDialog({
  open,
  onOpenChange,
  staffId,
  initialData,
}: EditStaffDialogProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const form = useForm<EditStaffFormValues>({
    resolver: zodResolver(editStaffSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      email: initialData?.email || "",
      contactNumber: initialData?.contactNumber || "",
      staffCategory: (initialData?.staffCategory as any) || null,
      assignedRole: initialData?.assignedRole || "",
      status: initialData?.status || "Active",
    },
  });

  // Update form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      form.reset({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        email: initialData.email || "",
        contactNumber: initialData.contactNumber || "",
        staffCategory: (initialData.staffCategory as any) || null,
        assignedRole: initialData.assignedRole || "",
        status: initialData.status || "Active",
      });
    }
  }, [initialData, form]);

  const onSubmit = async (values: EditStaffFormValues) => {
    if (!staffId) return;

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/library/staff/${staffId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to update staff member.");
        setIsUpdating(false);
        return;
      }

      toast.success("Staff member updated successfully.");
      setIsUpdating(false);
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to update staff:", error);
      toast.error("Network error while updating. Please retry.");
      setIsUpdating(false);
    }
  };

  if (!staffId || !initialData) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto sm:max-h-[90vh]">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold">
            Edit Staff Member
          </DialogTitle>
          <DialogDescription className="text-base">
            Update staff member personal information. Password changes are not
            available here.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 pt-4"
          >
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
                      <FormLabel className="font-medium">
                        First Name *
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isUpdating}
                          className="h-11"
                          placeholder="John"
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
                          disabled={isUpdating}
                          className="h-11"
                          placeholder="Doe"
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
                        disabled={isUpdating}
                        className="h-11"
                        placeholder="staff@library.edu"
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
                        disabled={isUpdating}
                        className="h-11"
                        placeholder="+1 (555) 123-4567"
                        value={field.value || ""}
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
                      <FormLabel className="font-medium">
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
                      <FormLabel className="font-medium">
                        Assigned Role
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isUpdating}
                          className="h-11"
                          placeholder="e.g., Librarian, Cataloger"
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional. Specify the staff member's primary role or
                        task.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">
                        


                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isUpdating}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Active users can log in. Inactive and Suspended users cannot access their accounts.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => onOpenChange(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:flex-1"
                disabled={isUpdating}
                size="lg"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating…
                  </>
                ) : (
                  "Update Staff Member"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

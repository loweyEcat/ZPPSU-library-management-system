"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { EditStaffDialog } from "@/components/admin/edit-staff-dialog";
import { getStaffById } from "@/app/admin/staff/add/actions";
import { toast } from "sonner";
import type { lib_users_staff_category, lib_users_status } from "@/generated/prisma/enums";

interface StaffMember {
  id: number;
  full_name: string;
  email: string;
  contact_number: string | null;
  profile_image: string | null;
  staff_category: lib_users_staff_category | null;
  assigned_role: string | null;
  status: lib_users_status;
  date_registered: string;
}

interface StaffTableProps {
  staff: StaffMember[];
  onRefresh?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatStaffCategory(category: string | null): string {
  if (!category) return "N/A";
  return category.replace(/_/g, " ");
}

export function StaffTable({ staff, onRefresh }: StaffTableProps) {
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedStaffId, setSelectedStaffId] = React.useState<number | null>(null);
  const [editingStaffData, setEditingStaffData] = React.useState<{
    firstName: string;
    lastName: string;
    email: string;
    contactNumber: string | null;
    staffCategory: string | null;
    assignedRole: string | null;
    status: "Active" | "Inactive" | "Suspended";
  } | null>(null);
  const [isLoadingStaff, setIsLoadingStaff] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleEdit = async (id: number) => {
    setIsLoadingStaff(true);
    setSelectedStaffId(id);
    try {
      const staffData = await getStaffById(id);
      if (staffData) {
        setEditingStaffData({
          firstName: staffData.firstName || "",
          lastName: staffData.lastName || "",
          email: staffData.email || "",
          contactNumber: staffData.contact_number || null,
          staffCategory: staffData.staff_category || null,
          assignedRole: staffData.assigned_role || null,
          status: staffData.status as "Active" | "Inactive" | "Suspended",
        });
        setEditDialogOpen(true);
      } else {
        toast.error("Staff member not found.");
      }
    } catch (error) {
      console.error("Failed to load staff data:", error);
      toast.error("Failed to load staff data. Please try again.");
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleDelete = (id: number) => {
    setSelectedStaffId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedStaffId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/library/staff/${selectedStaffId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to delete staff member.");
        setIsDeleting(false);
        return;
      }

      toast.success("Staff member deleted successfully.");
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedStaffId(null);
      
      if (onRefresh) {
        onRefresh();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete staff:", error);
      toast.error("Network error while deleting. Please retry.");
      setIsDeleting(false);
    }
  };

  const selectedStaff = selectedStaffId
    ? staff.find((s) => s.id === selectedStaffId)
    : null;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Full Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Staff Role</TableHead>
            <TableHead>Assigned Task</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No staff members found. Create one using the button above.
              </TableCell>
            </TableRow>
          ) : (
            staff.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {member.profile_image ? (
                        <AvatarImage
                          src={member.profile_image}
                          alt={member.full_name}
                        />
                      ) : null}
                      <AvatarFallback>
                        {getInitials(member.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{member.full_name}</span>
                  </div>
                </TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.contact_number || "N/A"}</TableCell>
                <TableCell>
                  {member.staff_category ? (
                    <Badge variant="outline">
                      {formatStaffCategory(member.staff_category)}
                    </Badge>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell>{member.assigned_role || "N/A"}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      member.status === "Active"
                        ? "default"
                        : member.status === "Inactive"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(member.id)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(member.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <EditStaffDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        staffId={selectedStaffId}
        initialData={editingStaffData || undefined}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the staff
              account for{" "}
              <span className="font-semibold">
                {selectedStaff?.full_name || "this staff member"}
              </span>
              . All associated data will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


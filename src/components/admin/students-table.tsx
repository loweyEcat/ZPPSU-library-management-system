"use client";

import * as React from "react";
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
import { Input } from "@/components/ui/input";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  UserCog,
  GraduationCap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { EditUserDialog } from "@/components/admin/edit-user-dialog";
import { DeleteStudentDialog } from "@/components/admin/delete-student-dialog";
import { getUserById } from "@/app/admin/users/actions";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Student {
  id: number;
  full_name: string;
  student_id: string | null;
  profile_image: string | null;
  section: string | null;
  department: string | null;
  year_level: string | null;
  status: "Active" | "Inactive" | "Suspended";
  date_registered: string;
}

interface StudentsTableProps {
  students: Student[];
  onRefresh?: () => void;
  isSuperAdmin?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const ITEMS_PER_PAGE = 15;

export function StudentsTable({
  students,
  onRefresh,
  isSuperAdmin = false,
}: StudentsTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isImpersonating, setIsImpersonating] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editingUserId, setEditingUserId] = React.useState<number | null>(null);
  const [editingUserData, setEditingUserData] = React.useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = React.useState(false);
  const [editingUserRole, setEditingUserRole] = React.useState<
    "Admin" | "Staff" | "Student"
  >("Student");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletingUserId, setDeletingUserId] = React.useState<number | null>(
    null
  );
  const [deletingUserName, setDeletingUserName] = React.useState<string>("");

  // Filter students based on search query
  const filteredStudents = React.useMemo(() => {
    if (!searchQuery.trim()) return students;

    const query = searchQuery.toLowerCase();
    return students.filter((student) => {
      return (
        student.full_name.toLowerCase().includes(query) ||
        (student.student_id &&
          student.student_id.toLowerCase().includes(query)) ||
        (student.section && student.section.toLowerCase().includes(query)) ||
        (student.department &&
          student.department.toLowerCase().includes(query)) ||
        (student.year_level && student.year_level.toLowerCase().includes(query))
      );
    });
  }, [students, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleEdit = async (id: number) => {
    setIsLoadingUser(true);
    setEditingUserId(id);
    try {
      const userData = await getUserById(id);
      if (userData) {
        setEditingUserRole(userData.user_role as "Admin" | "Staff" | "Student");
        setEditingUserData({
          fullName: userData.full_name,
          email: userData.email,
          contactNumber: userData.contact_number,
          yearLevel: userData.year_level,
          section: userData.section,
          department: userData.department,
          status: userData.status,
        });
        setEditDialogOpen(true);
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
      toast.error("Failed to load user data. Please try again.");
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (!isSuperAdmin) {
      toast.error("Only Super Admin can delete users.");
      return;
    }

    setDeletingUserId(id);
    setDeletingUserName(name);
    setDeleteDialogOpen(true);
  };

  const handleImpersonate = async (id: number) => {
    if (isImpersonating) return;

    setIsImpersonating(true);
    try {
      const response = await fetch("/api/library/impersonate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: id }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to impersonate user.");
        setIsImpersonating(false);
        return;
      }

      // Redirect to the appropriate dashboard
      router.push(data.redirectUrl || "/");
      router.refresh();
    } catch (error) {
      console.error("Impersonation error:", error);
      toast.error("An error occurred while impersonating the user.");
      setIsImpersonating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, student ID, section, department, or year level..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-11 bg-background border-2 focus:border-primary transition-colors"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border-2 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold">Profile</TableHead>
                <TableHead className="font-semibold">Full Name</TableHead>
                <TableHead className="font-semibold">Student ID</TableHead>
                <TableHead className="font-semibold">Section</TableHead>
                <TableHead className="font-semibold">Department</TableHead>
                <TableHead className="font-semibold">Year Level</TableHead>
                <TableHead className="font-semibold">Date Registered</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <GraduationCap className="h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground font-medium">
                        {searchQuery
                          ? "No students found matching your search."
                          : "No students found."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStudents.map((student) => (
                  <TableRow
                    key={student.id}
                    className="transition-colors hover:bg-muted/50 cursor-pointer"
                  >
                    <TableCell>
                      <Avatar className="h-10 w-10 ring-2 ring-background">
                        {student.profile_image ? (
                          <AvatarImage
                            src={student.profile_image}
                            alt={student.full_name}
                            className="object-cover"
                          />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(student.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      {student.full_name}
                    </TableCell>
                    <TableCell>
                      {student.student_id ? (
                        <Badge variant="outline" className="font-mono">
                          {student.student_id}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.section || (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.department || (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.year_level || (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(student.date_registered)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          student.status === "Active"
                            ? "default"
                            : student.status === "Inactive"
                            ? "secondary"
                            : "destructive"
                        }
                        className="font-medium"
                      >
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {isSuperAdmin && (
                            <DropdownMenuItem
                              onClick={() => handleImpersonate(student.id)}
                              disabled={isImpersonating}
                              className="cursor-pointer"
                            >
                              <UserCog className="mr-2 h-4 w-4" />
                              {isImpersonating
                                ? "Impersonating..."
                                : "Impersonate"}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleEdit(student.id)}
                            className="cursor-pointer"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleDelete(student.id, student.full_name)
                            }
                            className="text-destructive cursor-pointer focus:text-destructive"
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
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground font-medium">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {startIndex + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-foreground">
              {Math.min(endIndex, filteredStudents.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">
              {filteredStudents.length}
            </span>{" "}
            students
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages)
                      setCurrentPage(currentPage + 1);
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Edit User Dialog */}
      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        userId={editingUserId}
        userRole={editingUserRole as "Student"}
        initialData={editingUserData}
      />

      {/* Delete Student Dialog */}
      <DeleteStudentDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        studentId={deletingUserId}
        studentName={deletingUserName}
        onDelete={onRefresh}
      />
    </div>
  );
}

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Eye,
  Download,
  CheckCircle2,
  XCircle,
  Globe,
  FileText,
  Search,
  X,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ViewThesisDialog } from "@/components/student/view-thesis-dialog";
import { getStaffMembers } from "@/app/admin/books/actions";

interface ThesisDocument {
  id: number;
  title: string;
  researcher_name: string;
  academic_year: string | null;
  semester: string | null;
  department: string | null;
  year_level: string | null;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  status: string;
  submission_status: string;
  submitted_at: string;
  staff_reviewed_at: string | null;
  admin_reviewed_at: string | null;
  approved_at: string | null;
  published_at: string | null;
  student: {
    id: number;
    full_name: string;
    email: string;
    student_id: string | null;
  };
  reviewed_by_staff: {
    id: number;
    full_name: string;
  } | null;
  assigned_staff: {
    id: number;
    full_name: string;
    email: string;
  } | null;
  assigned_staff_id: number | null;
  document_type: string | null;
}

interface AdminThesisVerificationTableProps {
  documents: ThesisDocument[];
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function getStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Approved":
    case "Super_Admin_Approved":
    case "Published":
    case "Staff_Approved":
      return "default";
    case "Pending":
    case "Under_Review":
      return "secondary";
    case "Rejected":
    case "Staff_Rejected":
    case "Super_Admin_Rejected":
      return "destructive";
    default:
      return "outline";
  }
}

function getStatusLabel(status: string, submissionStatus: string): string {
  if (submissionStatus === "Staff_Approved") return "Staff Verified";
  if (submissionStatus === "Staff_Rejected") return "Staff Rejected";
  if (submissionStatus === "Super_Admin_Approved") return "Reviewed";
  if (submissionStatus === "Super_Admin_Rejected") return "Rejected";
  if (submissionStatus === "Published") return "Published";
  if (submissionStatus === "Revision_Requested") return "Revision Required";
  if (submissionStatus === "Withdrawn") return "Withdrawn";
  return status.replace(/_/g, " ");
}

const ITEMS_PER_PAGE = 10;

interface StaffMember {
  id: number;
  full_name: string;
  email: string;
}

export function AdminThesisVerificationTable({
  documents,
}: AdminThesisVerificationTableProps) {
  const router = useRouter();
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = React.useState(false);
  const [selectedDocument, setSelectedDocument] =
    React.useState<ThesisDocument | null>(null);
  const [reviewAction, setReviewAction] = React.useState<
    "approve" | "reject" | "publish" | null
  >(null);
  const [reviewNotes, setReviewNotes] = React.useState("");
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [isReviewing, setIsReviewing] = React.useState(false);
  const [staffMembers, setStaffMembers] = React.useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = React.useState<string>("");
  const [isLoadingStaff, setIsLoadingStaff] = React.useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [academicYearFilter, setAcademicYearFilter] =
    React.useState<string>("all");
  const [semesterFilter, setSemesterFilter] = React.useState<string>("all");
  const [currentPage, setCurrentPage] = React.useState(1);

  // Get unique values for filters
  const uniqueAcademicYears = React.useMemo(() => {
    const years = documents
      .map((doc) => doc.academic_year)
      .filter((year): year is string => year !== null && year !== "");
    return Array.from(new Set(years)).sort();
  }, [documents]);

  const uniqueSemesters = React.useMemo(() => {
    const semesters = documents
      .map((doc) => doc.semester)
      .filter((sem): sem is string => sem !== null && sem !== "");
    return Array.from(new Set(semesters)).sort();
  }, [documents]);

  // Filter documents
  const filteredDocuments = React.useMemo(() => {
    let filtered = documents;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((doc) => {
        const titleMatch = doc.title.toLowerCase().includes(query);
        const researcherMatch = doc.researcher_name
          .toLowerCase()
          .includes(query);
        const studentMatch = doc.student.full_name
          .toLowerCase()
          .includes(query);
        const academicYearMatch = doc.academic_year
          ?.toLowerCase()
          .includes(query);
        const semesterMatch = doc.semester?.toLowerCase().includes(query);
        return (
          titleMatch ||
          researcherMatch ||
          studentMatch ||
          academicYearMatch ||
          semesterMatch
        );
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((doc) => {
        if (statusFilter === "pending") {
          return (
            doc.submission_status === "Under_Review" ||
            doc.status === "Pending" ||
            doc.status === "Under_Review"
          );
        }
        if (statusFilter === "staff_approved") {
          return doc.submission_status === "Staff_Approved";
        }
        if (statusFilter === "approved") {
          return doc.submission_status === "Super_Admin_Approved";
        }
        if (statusFilter === "published") {
          return doc.submission_status === "Published";
        }
        if (statusFilter === "rejected") {
          return (
            doc.submission_status === "Staff_Rejected" ||
            doc.submission_status === "Super_Admin_Rejected"
          );
        }
        return (
          doc.submission_status === statusFilter || doc.status === statusFilter
        );
      });
    }

    // Academic year filter
    if (academicYearFilter !== "all") {
      filtered = filtered.filter(
        (doc) => doc.academic_year === academicYearFilter
      );
    }

    // Semester filter
    if (semesterFilter !== "all") {
      filtered = filtered.filter((doc) => doc.semester === semesterFilter);
    }

    return filtered;
  }, [
    documents,
    searchQuery,
    statusFilter,
    academicYearFilter,
    semesterFilter,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, academicYearFilter, semesterFilter]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setAcademicYearFilter("all");
    setSemesterFilter("all");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    academicYearFilter !== "all" ||
    semesterFilter !== "all";

  const handleView = async (document: ThesisDocument) => {
    try {
      const response = await fetch(`/api/library/thesis/${document.id}`);
      if (response.ok) {
        const fullDocument = await response.json();
        setSelectedDocument({ ...document, ...fullDocument });
      } else {
        setSelectedDocument(document);
      }
      setViewDialogOpen(true);
    } catch (error) {
      console.error("Failed to fetch document details:", error);
      setSelectedDocument(document);
      setViewDialogOpen(true);
    }
  };

  // Load staff members when dialog opens
  React.useEffect(() => {
    if (reviewDialogOpen && reviewAction === "approve") {
      loadStaffMembers();
    }
  }, [reviewDialogOpen, reviewAction]);

  const loadStaffMembers = async () => {
    setIsLoadingStaff(true);
    try {
      const staff = await getStaffMembers();
      setStaffMembers(staff);
    } catch (error) {
      console.error("Error loading staff members:", error);
      toast.error("Failed to load staff members.");
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleReview = (
    document: ThesisDocument,
    action: "approve" | "reject" | "publish"
  ) => {
    setSelectedDocument(document);
    setReviewAction(action);
    setReviewNotes("");
    setRejectionReason("");
    setSelectedStaffId("");
    setReviewDialogOpen(true);
  };

  const confirmReview = async () => {
    if (!selectedDocument || !reviewAction) return;

    setIsReviewing(true);
    try {
      const response = await fetch(
        `/api/library/thesis/${selectedDocument.id}/admin-review`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: reviewAction,
            review_notes: reviewNotes || null,
            rejection_reason: rejectionReason || null,
            assigned_staff_id:
              reviewAction === "approve" && selectedStaffId
                ? parseInt(selectedStaffId)
                : null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to review thesis document.");
        setIsReviewing(false);
        return;
      }

      toast.success(data.message || "Thesis document reviewed successfully.");
      setIsReviewing(false);
      setReviewDialogOpen(false);
      setSelectedDocument(null);
      setReviewAction(null);
      setReviewNotes("");
      setRejectionReason("");
      setSelectedStaffId("");
      router.refresh();
    } catch (error) {
      console.error("Failed to review thesis:", error);
      toast.error("Network error while reviewing. Please retry.");
      setIsReviewing(false);
    }
  };

  const handleDownload = (document: ThesisDocument) => {
    window.open(document.file_url, "_blank");
  };

  const canReview = (document: ThesisDocument) => {
    // Can approve/reject if staff approved or pending
    if (reviewAction === "approve" || reviewAction === "reject") {
      return (
        document.submission_status === "Staff_Approved" ||
        document.submission_status === "Under_Review" ||
        document.status === "Pending" ||
        document.status === "Under_Review"
      );
    }
    // Can publish if already approved
    if (reviewAction === "publish") {
      return document.submission_status === "Super_Admin_Approved";
    }
    return false;
  };

  return (
    <>
      {/* Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, researcher name, student name, academic year, or semester..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 bg-background border-2 focus:border-primary transition-colors"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-3 items-end">
          {/* Status Filter */}
          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending/Under Review</SelectItem>
                <SelectItem value="staff_approved">Staff Verified</SelectItem>
                <SelectItem value="approved">Admin Approved</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="Revision_Requested">
                  Revision Required
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Academic Year Filter */}
          {uniqueAcademicYears.length > 0 && (
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium mb-2 block">
                Academic Year
              </label>
              <Select
                value={academicYearFilter}
                onValueChange={setAcademicYearFilter}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {uniqueAcademicYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Semester Filter */}
          {uniqueSemesters.length > 0 && (
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium mb-2 block">Semester</label>
              <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All Semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {uniqueSemesters.map((semester) => (
                    <SelectItem key={semester} value={semester}>
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="h-10">
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filteredDocuments.length}
            </span>{" "}
            {filteredDocuments.length === 1 ? "document" : "documents"}
            {hasActiveFilters && (
              <span className="ml-2">(of {documents.length} total)</span>
            )}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border-2 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold">Student Name</TableHead>
                <TableHead className="font-semibold">Research Title</TableHead>
                <TableHead className="font-semibold">Academic Year</TableHead>
                <TableHead className="font-semibold">Semester</TableHead>
                <TableHead className="font-semibold">Assigned Staff</TableHead>
                <TableHead className="font-semibold">Document</TableHead>
                <TableHead className="font-semibold">Document Type</TableHead>
                <TableHead className="font-semibold">Date Submitted</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDocuments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {documents.length === 0
                      ? "No thesis documents found."
                      : "No documents match your filters. Try adjusting your search criteria."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDocuments.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {document.student.full_name}
                        </div>
                        {document.student.student_id && (
                          <div className="text-xs text-muted-foreground">
                            ID: {document.student.student_id}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className="max-w-[300px] truncate"
                        title={document.title}
                      >
                        {document.title}
                      </div>
                    </TableCell>
                    <TableCell>{document.academic_year || "N/A"}</TableCell>
                    <TableCell>{document.semester || "N/A"}</TableCell>
                    <TableCell>
                      {document.assigned_staff ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {document.assigned_staff.full_name}
                          </span>
                          {document.staff_reviewed_at && (
                            <span className="text-xs text-muted-foreground">
                              Date Reviewed:{" "}
                              {formatDate(document.staff_reviewed_at)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Not assigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium truncate max-w-[200px]">
                            {document.file_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(document.file_size)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {document.document_type || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(document.submitted_at)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(
                          document.submission_status
                        )}
                      >
                        {getStatusLabel(
                          document.status,
                          document.submission_status
                        )}
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
                          <DropdownMenuItem
                            onClick={() => handleView(document)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDownload(document)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          {/* Show approve/reject for documents that haven't been assigned to staff yet */}
                          {(!document.assigned_staff_id ||
                            document.submission_status === "Under_Review" ||
                            document.status === "Pending") && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleReview(document, "approve")
                                }
                                className="text-green-600"
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve & Assign Staff
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleReview(document, "reject")}
                                className="text-destructive"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {/* Show publish option for documents that have been reviewed by staff */}
                          {document.submission_status ===
                            "Super_Admin_Approved" && (
                            <DropdownMenuItem
                              onClick={() => handleReview(document, "publish")}
                              className="text-blue-600"
                            >
                              <Globe className="mr-2 h-4 w-4" />
                              Publish
                            </DropdownMenuItem>
                          )}
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
              {Math.min(endIndex, filteredDocuments.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">
              {filteredDocuments.length}
            </span>{" "}
            {filteredDocuments.length === 1 ? "document" : "documents"}
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

      {/* View Dialog */}
      {selectedDocument && (
        <ViewThesisDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          document={selectedDocument}
        />
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve"
                ? "Approve Thesis Document"
                : reviewAction === "reject"
                ? "Reject Thesis Document"
                : "Publish Thesis Document"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve"
                ? "Approve this thesis document and assign it to a staff member for verification. The document will be set to 'Under Review' status until the assigned staff completes their review."
                : reviewAction === "reject"
                ? "Reject this thesis document. Please provide a reason for rejection."
                : "Publish this thesis document. It will be made available publicly. Only documents that have been reviewed and approved by staff can be published."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedDocument && (
              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm font-medium">
                  {selectedDocument.title}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Submitted by: {selectedDocument.student.full_name}
                </div>
              </div>
            )}
            {reviewAction === "approve" && (
              <div className="space-y-2">
                <Label htmlFor="assigned-staff">
                  Assign Staff for Verification{" "}
                  <span className="text-destructive">*</span>
                </Label>
                {isLoadingStaff ? (
                  <div className="text-sm text-muted-foreground">
                    Loading staff members...
                  </div>
                ) : (
                  <Select
                    value={selectedStaffId}
                    onValueChange={setSelectedStaffId}
                    required
                  >
                    <SelectTrigger id="assigned-staff" className="h-11">
                      <SelectValue placeholder="Select a staff member to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffMembers.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id.toString()}>
                          {staff.full_name} ({staff.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  Only the assigned staff member will be able to see and verify
                  this document.
                </p>
              </div>
            )}
            {reviewAction === "reject" && (
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">
                  Rejection Reason <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Please provide a detailed reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="review-notes">
                Review Notes {reviewAction === "reject" ? "" : "(Optional)"}
              </Label>
              <Textarea
                id="review-notes"
                placeholder={
                  reviewAction === "approve"
                    ? "Add any notes or comments (optional)..."
                    : reviewAction === "reject"
                    ? "Add any additional notes..."
                    : "Add any notes about publishing (optional)..."
                }
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewDialogOpen(false);
                setReviewAction(null);
                setReviewNotes("");
                setRejectionReason("");
                setSelectedStaffId("");
              }}
              disabled={isReviewing}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReview}
              disabled={
                isReviewing ||
                (reviewAction === "reject" && !rejectionReason.trim()) ||
                (reviewAction === "approve" && !selectedStaffId)
              }
              variant={
                reviewAction === "approve" || reviewAction === "publish"
                  ? "default"
                  : "destructive"
              }
            >
              {isReviewing
                ? "Processing..."
                : reviewAction === "approve"
                ? "Approve"
                : reviewAction === "reject"
                ? "Reject"
                : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

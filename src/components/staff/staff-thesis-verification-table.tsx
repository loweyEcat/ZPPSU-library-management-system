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
  RefreshCw,
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
  document_type: string | null;
  admin_review_notes?: string | null;
  staff_review_notes?: string | null;
  rejection_reason?: string | null;
  student: {
    id: number;
    full_name: string;
    email: string;
    student_id: string | null;
    college?: string | null;
  };
}

interface StaffThesisVerificationTableProps {
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

function getFileFormat(fileType: string | null): string {
  if (!fileType) return "N/A";

  // Remove "application/" prefix if present
  let format = fileType.replace(/^application\//i, "");

  // Remove any path or additional prefixes
  format = format.split("/").pop() || format;
  format = format.split("\\").pop() || format;

  // Extract just the extension/format
  const parts = format.split(".");
  if (parts.length > 1) {
    format = parts[parts.length - 1];
  }

  // Common format mappings
  const formatMap: Record<string, string> = {
    pdf: "PDF",
    doc: "DOC",
    docx: "DOCX",
    xls: "XLS",
    xlsx: "XLSX",
    ppt: "PPT",
    pptx: "PPTX",
    epub: "EPUB",
    mobi: "MOBI",
    txt: "TXT",
    rtf: "RTF",
    odt: "ODT",
    html: "HTML",
    xml: "XML",
  };

  const lowerFormat = format.toLowerCase();
  return formatMap[lowerFormat] || format.toUpperCase();
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

function getDocumentTypeBadge(type: string | null): React.ReactElement {
  switch (type) {
    case "Thesis":
      return (
        <Badge variant="default" className="bg-blue-500">
          Thesis
        </Badge>
      );
    case "Journal":
      return (
        <Badge variant="secondary" className="bg-purple-500">
          Journal
        </Badge>
      );
    case "Capstone":
      return (
        <Badge variant="outline" className="bg-green-500">
          Capstone
        </Badge>
      );
    case "Ebooks":
      return (
        <Badge variant="outline" className="bg-orange-500">
          Ebooks
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

const ITEMS_PER_PAGE = 10;

export function StaffThesisVerificationTable({
  documents,
}: StaffThesisVerificationTableProps) {
  const router = useRouter();
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = React.useState(false);
  const [selectedDocument, setSelectedDocument] =
    React.useState<ThesisDocument | null>(null);
  const [reviewAction, setReviewAction] = React.useState<
    "approve" | "reject" | "request_revision" | null
  >(null);
  const [reviewNotes, setReviewNotes] = React.useState("");
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [isReviewing, setIsReviewing] = React.useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [academicYearFilter, setAcademicYearFilter] =
    React.useState<string>("all");
  const [semesterFilter, setSemesterFilter] = React.useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = React.useState<string>("all");
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

  const uniqueDepartments = React.useMemo(() => {
    const departments = documents
      .map((doc) => doc.department)
      .filter((dept): dept is string => dept !== null && dept !== "");
    return Array.from(new Set(departments)).sort();
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
        const departmentMatch = doc.department?.toLowerCase().includes(query);
        return (
          titleMatch ||
          researcherMatch ||
          studentMatch ||
          academicYearMatch ||
          semesterMatch ||
          departmentMatch
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
        if (statusFilter === "approved") {
          return doc.submission_status === "Staff_Approved";
        }
        if (statusFilter === "rejected") {
          return doc.submission_status === "Staff_Rejected";
        }
        if (statusFilter === "revision") {
          return doc.submission_status === "Revision_Requested";
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

    // Department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter((doc) => doc.department === departmentFilter);
    }

    return filtered;
  }, [
    documents,
    searchQuery,
    statusFilter,
    academicYearFilter,
    semesterFilter,
    departmentFilter,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    statusFilter,
    academicYearFilter,
    semesterFilter,
    departmentFilter,
  ]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setAcademicYearFilter("all");
    setSemesterFilter("all");
    setDepartmentFilter("all");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    academicYearFilter !== "all" ||
    semesterFilter !== "all" ||
    departmentFilter !== "all";

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

  const handleReview = (
    document: ThesisDocument,
    action: "approve" | "reject" | "request_revision"
  ) => {
    setSelectedDocument(document);
    setReviewAction(action);
    setReviewNotes("");
    setRejectionReason("");
    setReviewDialogOpen(true);
  };

  const confirmReview = async () => {
    if (!selectedDocument || !reviewAction) return;

    setIsReviewing(true);
    try {
      const response = await fetch(
        `/api/library/thesis/${selectedDocument.id}/review`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: reviewAction,
            review_notes: reviewNotes || null,
            rejection_reason: rejectionReason || null,
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
    return (
      document.submission_status === "Under_Review" ||
      document.status === "Pending" ||
      document.status === "Under_Review" ||
      document.submission_status === "Revision_Requested"
    );
  };

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, researcher name, student name, academic year, semester, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending/Under Review</SelectItem>
            <SelectItem value="approved">Staff Verified</SelectItem>
            <SelectItem value="rejected">Staff Rejected</SelectItem>
            <SelectItem value="revision">Revision Required</SelectItem>
          </SelectContent>
        </Select>
        {uniqueAcademicYears.length > 0 && (
          <Select
            value={academicYearFilter}
            onValueChange={setAcademicYearFilter}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Academic Year" />
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
        )}
        {uniqueSemesters.length > 0 && (
          <Select value={semesterFilter} onValueChange={setSemesterFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Semester" />
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
        )}
        {uniqueDepartments.length > 0 && (
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {uniqueDepartments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
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

      {/* Table */}
      <div className="rounded-lg border-2 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#800020] hover:bg-[#800020]">
                <TableHead className="font-semibold text-white w-12">
                  #
                </TableHead>
                <TableHead className="font-semibold text-white">
                  Uploader Name
                </TableHead>
                <TableHead className="font-semibold text-white">
                  Program
                </TableHead>
                <TableHead className="font-semibold text-white">
                  File Type
                </TableHead>
                <TableHead className="font-semibold text-white">
                  Research/Books Title
                </TableHead>
                <TableHead className="font-semibold text-white">
                  Resources Type
                </TableHead>
                <TableHead className="font-semibold text-white">
                  Date Uploaded
                </TableHead>
                <TableHead className="font-semibold text-white">
                  Date Assigned
                </TableHead>
                <TableHead className="font-semibold text-white">
                  Remarks
                </TableHead>
                <TableHead className="font-semibold text-white">
                  Status
                </TableHead>
                <TableHead className="text-right font-semibold text-white">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDocuments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {documents.length === 0
                      ? "No thesis documents found for review."
                      : "No documents match your filters. Try adjusting your search criteria."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDocuments.map((document, index) => (
                  <TableRow key={document.id}>
                    {/* # */}
                    <TableCell className="font-medium">
                      {startIndex + index + 1}
                    </TableCell>
                    {/* Uploader Name */}
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
                    {/* College */}
                    <TableCell>
                      <div className="max-w-[200px]">
                        {document.student.college || "N/A"}
                      </div>
                    </TableCell>

                    {/* File Type */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {getFileFormat(document.file_type)}
                        </span>
                      </div>
                    </TableCell>
                    {/* Research/Books Title */}
                    <TableCell>
                      <div
                        className="max-w-[300px] truncate"
                        title={document.title}
                      >
                        {document.title}
                      </div>
                    </TableCell>
                    {/* Resources Type */}
                    <TableCell>
                      {getDocumentTypeBadge(document.document_type)}
                    </TableCell>
                    {/* Date Uploaded */}
                    <TableCell>{formatDate(document.submitted_at)}</TableCell>
                    {/* Date Assigned */}
                    <TableCell>
                      {formatDate(document.admin_reviewed_at)}
                    </TableCell>
                    {/* Remarks */}
                    <TableCell>
                      <div className="max-w-[200px]">
                        {document.admin_review_notes ||
                        document.staff_review_notes ||
                        document.rejection_reason ? (
                          <div
                            className="text-xs text-muted-foreground truncate"
                            title={
                              document.admin_review_notes ||
                              document.staff_review_notes ||
                              document.rejection_reason ||
                              ""
                            }
                          >
                            {document.admin_review_notes ||
                              document.staff_review_notes ||
                              document.rejection_reason}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            N/A
                          </span>
                        )}
                      </div>
                    </TableCell>
                    {/* Status */}
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
                            onClick={() =>
                              router.push(
                                `/dashboard/staff/thesis-verification/${document.id}/preview`
                              )
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Document
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleView(document)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDownload(document)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          {canReview(document) && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleReview(document, "approve")
                                }
                                className="text-green-600"
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleReview(document, "request_revision")
                                }
                                className="text-orange-600"
                              >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Request Revision
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
                : "Request Revision"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve"
                ? "Approve this thesis document. It will be forwarded to admin for final review."
                : reviewAction === "reject"
                ? "Reject this thesis document. Please provide a reason for rejection."
                : "Request revision for this thesis document. Please provide notes on what needs to be revised."}
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
                    : "Please specify what needs to be revised..."
                }
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                required={reviewAction === "request_revision"}
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
                (reviewAction === "request_revision" && !reviewNotes.trim())
              }
              variant={
                reviewAction === "approve"
                  ? "default"
                  : reviewAction === "reject"
                  ? "destructive"
                  : "default"
              }
            >
              {isReviewing
                ? "Processing..."
                : reviewAction === "approve"
                ? "Approve"
                : reviewAction === "reject"
                ? "Reject"
                : "Request Revision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

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
  Eye,
  Pencil,
  Trash2,
  Download,
  MoreHorizontal,
  FileText,
  Search,
  X,
} from "lucide-react";
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
import { toast } from "sonner";
import { UploadThesisDialog } from "@/components/student/upload-thesis-dialog";

interface ThesisDocument {
  id: number;
  title: string;
  researcher_name: string;
  academic_year: string | null;
  semester: string | null;
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
  document_type: string | null;
  assigned_staff_name?: string | null;
  remarks?: string | null;
}

interface ThesisDocumentsTableProps {
  documents: ThesisDocument[];
  uploaderName: string;
  onRefresh?: () => void;
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
  if (submissionStatus === "Super_Admin_Approved") return "Approved";
  if (submissionStatus === "Super_Admin_Rejected") return "Rejected";
  if (submissionStatus === "Published") return "Published";
  if (submissionStatus === "Revision_Requested") return "Revision Required";
  if (submissionStatus === "Withdrawn") return "Withdrawn";
  return status.replace(/_/g, " ");
}

const ITEMS_PER_PAGE = 10;

export function ThesisDocumentsTable({
  documents,
  uploaderName,
  onRefresh,
}: ThesisDocumentsTableProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [selectedDocument, setSelectedDocument] =
    React.useState<ThesisDocument | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [currentPage, setCurrentPage] = React.useState(1);

  // Filter documents
  const filteredDocuments = React.useMemo(() => {
    let filtered = documents;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((doc) => {
        const researcherMatch = doc.researcher_name
          .toLowerCase()
          .includes(query);
        const fileNameMatch = doc.file_name.toLowerCase().includes(query);
        const assignedStaffMatch = doc.assigned_staff_name
          ?.toLowerCase()
          .includes(query);
        const remarksMatch = doc.remarks?.toLowerCase().includes(query);
        return (
          researcherMatch || fileNameMatch || assignedStaffMatch || remarksMatch
        );
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((doc) => {
        if (statusFilter === "approved") {
          return (
            doc.submission_status === "Super_Admin_Approved" ||
            doc.submission_status === "Published"
          );
        }
        if (statusFilter === "pending") {
          return (
            doc.submission_status === "Under_Review" ||
            doc.status === "Pending" ||
            doc.status === "Under_Review"
          );
        }
        if (statusFilter === "rejected") {
          return (
            doc.submission_status === "Staff_Rejected" ||
            doc.submission_status === "Super_Admin_Rejected" ||
            doc.status === "Rejected"
          );
        }
        if (statusFilter === "revision") {
          return (
            doc.submission_status === "Revision_Requested" ||
            doc.status === "Revision_Required"
          );
        }
        return (
          doc.submission_status === statusFilter || doc.status === statusFilter
        );
      });
    }

    return filtered;
  }, [documents, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const hasActiveFilters = searchQuery.trim() !== "" || statusFilter !== "all";

  const handleView = async (document: ThesisDocument) => {
    try {
      // Fetch full document details
      const response = await fetch(`/api/library/thesis/${document.id}`);
      if (response.ok) {
        const fullDocument = await response.json();
        setSelectedDocument(fullDocument);
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

  const handleEdit = async (document: ThesisDocument) => {
    // Only allow editing if status allows it
    if (
      document.status !== "Pending" &&
      document.status !== "Rejected" &&
      document.status !== "Revision_Required"
    ) {
      toast.error("Cannot edit document in current status.");
      return;
    }
    try {
      // Fetch full document details for editing
      const response = await fetch(`/api/library/thesis/${document.id}`);
      if (response.ok) {
        const fullDocument = await response.json();
        setSelectedDocument(fullDocument);
      } else {
        setSelectedDocument(document);
      }
      setEditDialogOpen(true);
    } catch (error) {
      console.error("Failed to fetch document details:", error);
      setSelectedDocument(document);
      setEditDialogOpen(true);
    }
  };

  const handleDelete = (document: ThesisDocument) => {
    // Only allow deletion if status allows it
    if (document.status !== "Pending" && document.status !== "Rejected") {
      toast.error("Cannot delete document in current status.");
      return;
    }
    setSelectedDocument(document);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedDocument) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/library/thesis/${selectedDocument.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to delete thesis document.");
        setIsDeleting(false);
        return;
      }

      toast.success("Thesis document deleted successfully.");
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedDocument(null);

      if (onRefresh) {
        onRefresh();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete thesis:", error);
      toast.error("Network error while deleting. Please retry.");
      setIsDeleting(false);
    }
  };

  const handleDownload = (document: ThesisDocument) => {
    window.open(document.file_url, "_blank");
  };

  const canEdit = (document: ThesisDocument) => {
    return (
      document.status === "Pending" ||
      document.status === "Rejected" ||
      document.status === "Revision_Required"
    );
  };

  const canDelete = (document: ThesisDocument) => {
    return document.status === "Pending" || document.status === "Rejected";
  };

  return (
    <>
      {/* Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by researcher name, file name, assigned staff, or remarks..."
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
                <SelectItem value="approved">Approved/Published</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="revision">Revision Required</SelectItem>
                <SelectItem value="Staff_Approved">Staff Verified</SelectItem>
                <SelectItem value="Withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                <TableHead className="font-semibold">Full Name</TableHead>
                <TableHead className="font-semibold">
                  Uploaded Document
                </TableHead>
                <TableHead className="font-semibold">Assigned Staff</TableHead>
                <TableHead className="font-semibold">Date Uploaded</TableHead>
                <TableHead className="font-semibold">Date Reviewed</TableHead>
                <TableHead className="font-semibold">Date Published</TableHead>
                <TableHead className="font-semibold">Remarks</TableHead>
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
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {documents.length === 0
                      ? "No thesis documents found. Upload your first document using the button above."
                      : "No documents match your filters. Try adjusting your search criteria."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDocuments.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <span className="font-medium">{uploaderName}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span
                            className="text-sm font-medium truncate max-w-[200px]"
                            title={document.file_name}
                          >
                            {document.file_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(document.file_size)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {document.assigned_staff_name || "N/A"}
                    </TableCell>
                    <TableCell>{formatDate(document.submitted_at)}</TableCell>
                    <TableCell>
                      {document.staff_reviewed_at
                        ? formatDate(document.staff_reviewed_at)
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {document.published_at
                        ? formatDate(document.published_at)
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div
                        className="max-w-[200px] truncate"
                        title={document.remarks || undefined}
                      >
                        {document.remarks || "N/A"}
                      </div>
                    </TableCell>
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
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDownload(document)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          {canEdit(document) && (
                            <DropdownMenuItem
                              onClick={() => handleEdit(document)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDelete(document) && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(document)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
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
        <UploadThesisDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          document={selectedDocument}
          mode="view"
        />
      )}

      {/* Edit Dialog */}
      {selectedDocument && canEdit(selectedDocument) && (
        <UploadThesisDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          document={selectedDocument}
          mode="edit"
          onSuccess={() => {
            setEditDialogOpen(false);
            if (onRefresh) onRefresh();
            router.refresh();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              thesis document
              <span className="font-semibold">
                {" "}
                "{selectedDocument?.title}"
              </span>
              .
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
    </>
  );
}

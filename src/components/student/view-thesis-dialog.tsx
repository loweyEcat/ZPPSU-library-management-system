"use client";

import * as React from "react";
import { FileText, User, Calendar, Download, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ThesisDocument {
  id: number;
  title: string;
  researcher_name: string;
  abstract?: string | null;
  keywords?: string | null;
  department?: string | null;
  year_level?: string | null;
  academic_year?: string | null;
  semester?: string | null;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  status?: string;
  submission_status?: string;
  staff_review_notes?: string | null;
  admin_review_notes?: string | null;
  rejection_reason?: string | null;
  submitted_at?: string;
  staff_reviewed_at?: string | null;
  admin_reviewed_at?: string | null;
  approved_at?: string | null;
}

interface ViewThesisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: ThesisDocument;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
}

function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return "N/A";
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

export function ViewThesisDialog({
  open,
  onOpenChange,
  document,
}: ViewThesisDialogProps) {
  const handleDownload = () => {
    if (document.file_url) {
      window.open(document.file_url, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold">
            Thesis Document Details
          </DialogTitle>
          <DialogDescription className="text-base">
            View detailed information about your thesis document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Document Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Document Information
              </h3>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Research Title
              </label>
              <p className="text-sm font-medium mt-1">{document.title}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                <User className="h-3.5 w-3.5" />
                Researcher Names
                {document.researcher_name && (
                  <span className="text-xs text-muted-foreground font-normal">
                    (
                    {
                      document.researcher_name
                        .split(",")
                        .filter((n) => n.trim()).length
                    }{" "}
                    researcher
                    {document.researcher_name.split(",").filter((n) => n.trim())
                      .length !== 1
                      ? "s"
                      : ""}
                    )
                  </span>
                )}
              </label>
              {document.researcher_name ? (
                <div className="mt-1 p-4 rounded-md border bg-muted/30 min-h-[60px] max-h-[200px] overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {document.researcher_name.split(",").map((name, index) => {
                      const trimmedName = name.trim();
                      if (!trimmedName) return null;
                      return (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="px-3 py-1.5 text-sm font-medium whitespace-nowrap"
                        >
                          {trimmedName}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">N/A</p>
              )}
            </div>

            {document.abstract && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Abstract
                </label>
                <p className="text-sm mt-1 whitespace-pre-wrap">
                  {document.abstract}
                </p>
              </div>
            )}

            {document.keywords && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Keywords
                </label>
                <p className="text-sm mt-1">{document.keywords}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Academic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Academic Information
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Department
                </label>
                <p className="text-sm font-medium mt-1">
                  {document.department || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Year Level
                </label>
                <p className="text-sm font-medium mt-1">
                  {document.year_level || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Academic Year
                </label>
                <p className="text-sm font-medium mt-1">
                  {document.academic_year || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Semester
                </label>
                <p className="text-sm font-medium mt-1">
                  {document.semester || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* File Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                File Information
              </h3>
              {document.file_url && (
                <Button onClick={handleDownload} size="sm" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  File Name
                </label>
                <p className="text-sm font-medium mt-1">
                  {document.file_name || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  File Size
                </label>
                <p className="text-sm font-medium mt-1">
                  {formatFileSize(document.file_size)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Status and Dates */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Status & Timeline
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <div className="mt-1">
                  <Badge
                    variant={getStatusBadgeVariant(
                      document.submission_status || document.status || ""
                    )}
                  >
                    {getStatusLabel(
                      document.status || "",
                      document.submission_status || ""
                    )}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Date Uploaded
                  </label>
                  <p className="text-sm mt-1">
                    {formatDate(document.submitted_at)}
                  </p>
                </div>
                {document.staff_reviewed_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Date Requested (Staff Review)
                    </label>
                    <p className="text-sm mt-1">
                      {formatDate(document.staff_reviewed_at)}
                    </p>
                  </div>
                )}
                {document.approved_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Date Approved
                    </label>
                    <p className="text-sm mt-1">
                      {formatDate(document.approved_at)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Review Notes */}
          {(document.staff_review_notes ||
            document.admin_review_notes ||
            document.rejection_reason) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Review Notes
                </h3>

                {document.staff_review_notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Staff Review Notes
                    </label>
                    <p className="text-sm mt-1 whitespace-pre-wrap bg-muted p-3 rounded-md">
                      {document.staff_review_notes}
                    </p>
                  </div>
                )}

                {document.admin_review_notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Admin Review Notes
                    </label>
                    <p className="text-sm mt-1 whitespace-pre-wrap bg-muted p-3 rounded-md">
                      {document.admin_review_notes}
                    </p>
                  </div>
                )}

                {document.rejection_reason && (
                  <div>
                    <label className="text-sm font-medium text-destructive">
                      Rejection Reason
                    </label>
                    <p className="text-sm mt-1 whitespace-pre-wrap bg-destructive/10 p-3 rounded-md text-destructive">
                      {document.rejection_reason}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={() => onOpenChange(false)} variant="outline">
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

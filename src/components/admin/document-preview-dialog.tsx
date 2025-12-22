"use client";

import * as React from "react";
import { X, Download, FileText, User, Calendar, BookOpen } from "lucide-react";
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
import { ReactReader } from "react-reader";

interface PublishedDocument {
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
  approved_at: string | null;
  published_at: string | null;
  document_type: string | null;
  abstract?: string | null;
  keywords?: string | null;
  journal_name?: string | null;
  journal_volume?: string | null;
  journal_issue?: string | null;
  doi?: string | null;
  co_authors?: string | null;
  adviser_name?: string | null;
  project_type?: string | null;
  capstone_category?: string | null;
  program?: string | null;
  student: {
    id: number;
    full_name: string;
    email: string;
    student_id: string | null;
  };
}

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: PublishedDocument;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
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
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

function isPDF(fileType: string, fileName: string): boolean {
  return (
    fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")
  );
}

function isEPUB(fileType: string, fileName: string): boolean {
  return (
    fileType === "application/epub+zip" ||
    fileName.toLowerCase().endsWith(".epub")
  );
}

export function DocumentPreviewDialog({
  open,
  onOpenChange,
  document,
}: DocumentPreviewDialogProps) {
  const [location, setLocation] = React.useState<string | number>(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [previewError, setPreviewError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setIsLoading(true);
      setPreviewError(null);
    }
  }, [open]);

  const handleDownload = () => {
    if (document.file_url) {
      window.open(document.file_url, "_blank");
    }
  };

  const fileType = document.file_type || "";
  const fileName = document.file_name || "";
  const isPDFFile = isPDF(fileType, fileName);
  const isEPUBFile = isEPUB(fileType, fileName);
  const canPreview = isPDFFile || isEPUBFile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-semibold mb-2">
                {document.title}
              </DialogTitle>
              <DialogDescription className="text-base">
                <div className="flex items-center gap-2 mb-2">
                  {getDocumentTypeBadge(document.document_type)}
                  <span className="text-muted-foreground">
                    Published: {formatDate(document.published_at)}
                  </span>
                </div>
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Document Info Sidebar */}
          <div className="px-6 py-4 border-b bg-muted/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground font-medium mb-1">
                  Researcher
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="truncate">{document.researcher_name}</span>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground font-medium mb-1">
                  Student
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="truncate">
                    {document.student.full_name}
                    {document.student.student_id &&
                      ` (${document.student.student_id})`}
                  </span>
                </div>
              </div>
              {document.department && (
                <div>
                  <div className="text-muted-foreground font-medium mb-1">
                    Department
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{document.department}</span>
                  </div>
                </div>
              )}
              <div>
                <div className="text-muted-foreground font-medium mb-1">
                  File Size
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{formatFileSize(document.file_size)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Document Preview */}
          <div className="flex-1 overflow-hidden relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading document...</p>
                </div>
              </div>
            )}

            {previewError && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                <div className="text-center p-6">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">{previewError}</p>
                  <Button onClick={handleDownload} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download Instead
                  </Button>
                </div>
              </div>
            )}

            {canPreview && !previewError && (
              <div className="h-full w-full">
                {isPDFFile ? (
                  <iframe
                    src={document.file_url}
                    className="w-full h-full border-0"
                    title={document.title}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                      setIsLoading(false);
                      setPreviewError(
                        "Failed to load PDF. Please try downloading the file."
                      );
                    }}
                  />
                ) : isEPUBFile ? (
                  <div className="h-full w-full bg-white">
                    <ReactReader
                      url={document.file_url}
                      location={location}
                      locationChanged={(loc: string | number) =>
                        setLocation(loc)
                      }
                      loadingView={
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">
                              Loading EPUB...
                            </p>
                          </div>
                        </div>
                      }
                      epubOptions={{
                        allowScriptedContent: true,
                      }}
                      getRendition={(rendition) => {
                        rendition.themes.default({
                          body: {
                            "font-family":
                              "system-ui, -apple-system, sans-serif",
                            "font-size": "18px",
                            "line-height": "1.6",
                          },
                        });
                      }}
                    />
                  </div>
                ) : null}
              </div>
            )}

            {!canPreview && (
              <div className="h-full flex items-center justify-center bg-muted/50">
                <div className="text-center p-6">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">
                    Preview not available for this file type
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    File type: {fileType || "Unknown"}
                  </p>
                  <Button onClick={handleDownload} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download File
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, User, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ReactReader } from "react-reader";
import { checkDocumentAccess } from "@/app/admin/resources/actions";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  is_restricted?: boolean;
  time_limit_minutes?: number | null;
  student: {
    id: number;
    full_name: string;
    email: string;
    student_id: string | null;
  };
}

interface DocumentPreviewPageProps {
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

export function DocumentPreviewPage({ document }: DocumentPreviewPageProps) {
  const router = useRouter();
  const [location, setLocation] = React.useState<string | number>(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const [hasAccess, setHasAccess] = React.useState(true);

  // Check access - Admins have unrestricted access (no time limits, no max attempts)
  React.useEffect(() => {
    const initializeSession = async () => {
      // Check access first
      const accessResult = await checkDocumentAccess(document.id);
      if (!accessResult.hasAccess) {
        setHasAccess(false);
        setPreviewError(accessResult.error || "Access denied");
        return;
      }

      // For admins, we don't need to track reading sessions (no restrictions)
      // Just set hasAccess to true
      setHasAccess(true);
    };

    initializeSession();
  }, [document.id]);

  React.useEffect(() => {
    setIsLoading(true);
    setPreviewError(null);
  }, [document.id]);

  const handleDownload = () => {
    if (document.file_url) {
      window.open(document.file_url, "_blank");
    }
  };

  const handleBack = () => {
    router.push("/admin/resources");
  };

  const fileType = document.file_type || "";
  const fileName = document.file_name || "";
  const isPDFFile = isPDF(fileType, fileName);
  const isEPUBFile = isEPUB(fileType, fileName);
  const canPreview = isPDFFile || isEPUBFile;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background flex-shrink-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Resources
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-2xl font-semibold line-clamp-1">
                  {document.title}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {getDocumentTypeBadge(document.document_type)}
                  <span className="text-sm text-muted-foreground">
                    Published: {formatDate(document.published_at)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Access Denied */}
      {!hasAccess && (
        <div className="flex-1 flex items-center justify-center bg-muted/50">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>{previewError}</AlertDescription>
            <Button variant="outline" className="mt-4" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </Alert>
        </div>
      )}

      {/* Document Info Bar */}
      <div className="border-b bg-muted/50 flex-shrink-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
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
      </div>

      {/* Document Preview */}
      {hasAccess && (
        <div className="flex-1 relative bg-background overflow-hidden">
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
                <div className="h-full w-full bg-[#f5f5f0] relative">
                  <ReactReader
                    url={document.file_url}
                    location={location}
                    locationChanged={(loc: string | number) => {
                      setLocation(loc);
                      setIsLoading(false);
                    }}
                    loadingView={
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                          <p className="text-muted-foreground">
                            Loading document...
                          </p>
                        </div>
                      </div>
                    }
                    epubOptions={{
                      allowScriptedContent: true,
                    }}
                    getRendition={(rendition) => {
                      // Set up book-like styling
                      const theme = {
                        body: {
                          "font-family":
                            "'Georgia', 'Times New Roman', serif !important",
                          "font-size": "16px !important",
                          "line-height": "1.8 !important",
                          color: "#333 !important",
                          background: "#f5f5f0 !important",
                          padding: "2rem !important",
                        },
                        p: {
                          "margin-bottom": "1rem !important",
                          "text-align": "justify !important",
                          "text-indent": "0 !important",
                        },
                        "h1, h2, h3, h4, h5, h6": {
                          "font-weight": "bold !important",
                          color: "#1a1a1a !important",
                          margin: "2rem 0 1rem 0 !important",
                          "text-align": "left !important",
                        },
                        img: {
                          "max-width": "100% !important",
                          height: "auto !important",
                          margin: "1rem auto !important",
                          display: "block !important",
                        },
                      };

                      rendition.themes.default(theme);
                      rendition.themes.select("default");

                      // Use paginated flow for book-like experience
                      rendition.flow("paginated");

                      // Handle content styling after it's loaded
                      rendition.hooks.content.register((contents: any) => {
                        const body = contents.document.body;
                        if (body) {
                          body.style.fontFamily =
                            "'Georgia', 'Times New Roman', serif";
                          body.style.fontSize = "16px";
                          body.style.lineHeight = "1.8";
                          body.style.color = "#333";
                          body.style.background = "#f5f5f0";
                          body.style.padding = "2rem";
                        }

                        // Style paragraphs
                        const paragraphs =
                          contents.document.querySelectorAll("p");
                        paragraphs.forEach((p: HTMLElement) => {
                          p.style.textAlign = "justify";
                          p.style.marginBottom = "1rem";
                        });

                        // Style headings
                        const headings = contents.document.querySelectorAll(
                          "h1, h2, h3, h4, h5, h6"
                        );
                        headings.forEach((h: HTMLElement) => {
                          h.style.fontWeight = "bold";
                          h.style.color = "#1a1a1a";
                          h.style.margin = "2rem 0 1rem 0";
                        });

                        // Style images
                        const images =
                          contents.document.querySelectorAll("img");
                        images.forEach((img: HTMLImageElement) => {
                          img.style.maxWidth = "100%";
                          img.style.height = "auto";
                          img.style.display = "block";
                          img.style.margin = "1rem auto";
                        });
                      });

                      rendition.display();
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
      )}
    </div>
  );
}

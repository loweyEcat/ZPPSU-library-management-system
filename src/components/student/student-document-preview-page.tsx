"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileText,
  User,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ReactReader } from "react-reader";
import {
  startReadingSession,
  endReadingSession,
} from "@/app/admin/resources/actions";
import {
  getStudentAttemptCount,
  checkDownloadPermission,
} from "@/app/dashboard/student/resources/actions";
import { toast } from "sonner";
import { Clock, Target } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RequestDownloadPermissionDialog } from "@/components/student/request-download-permission-dialog";

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

interface StudentDocumentPreviewPageProps {
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

export function StudentDocumentPreviewPage({
  document,
}: StudentDocumentPreviewPageProps) {
  const router = useRouter();
  const [location, setLocation] = React.useState<string | number>(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const [readingSessionId, setReadingSessionId] = React.useState<number | null>(
    null
  );
  const [readingTime, setReadingTime] = React.useState(0); // in seconds
  const [timeLimitExceeded, setTimeLimitExceeded] = React.useState(false);
  const [attemptCount, setAttemptCount] = React.useState<number | null>(null);
  const [maxAttempts, setMaxAttempts] = React.useState<number | null>(null);
  const [showDownloadDialog, setShowDownloadDialog] = React.useState(false);
  const startTimeRef = React.useRef<number>(Date.now());

  // Fetch attempt count
  React.useEffect(() => {
    const fetchAttemptCount = async () => {
      const result = await getStudentAttemptCount(document.id);
      setAttemptCount(result.attemptCount);
      setMaxAttempts(result.maxAttempts);
    };

    fetchAttemptCount();
  }, [document.id]);

  // Start reading session
  React.useEffect(() => {
    const initializeSession = async () => {
      // Start reading session
      const sessionResult = await startReadingSession(document.id);
      if (sessionResult.error) {
        setPreviewError(sessionResult.error);
        return;
      }

      if (sessionResult.session_id) {
        setReadingSessionId(sessionResult.session_id);
        startTimeRef.current = Date.now();
      }
    };

    initializeSession();

    // Cleanup: End reading session when component unmounts
    return () => {
      if (readingSessionId) {
        endReadingSession(readingSessionId).catch(console.error);
      }
    };
  }, [document.id]);

  // Track reading time and enforce time limit
  React.useEffect(() => {
    if (!readingSessionId || !document.time_limit_minutes) return;

    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor(
        (Date.now() - startTimeRef.current) / 1000
      );
      setReadingTime(elapsedSeconds);

      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      if (elapsedMinutes >= (document.time_limit_minutes || 0)) {
        setTimeLimitExceeded(true);
        clearInterval(interval);

        // Auto-logout after 5 seconds warning
        setTimeout(async () => {
          if (readingSessionId) {
            await endReadingSession(readingSessionId);
          }
          toast.error("Time limit exceeded. You have been logged out.");
          router.push("/dashboard/student/resources");
        }, 5000);
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [readingSessionId, document.time_limit_minutes, router]);

  React.useEffect(() => {
    setIsLoading(true);
    setPreviewError(null);
  }, [document.id]);

  const handleDownload = async () => {
    // Check if student has approved download permission
    const permissionCheck = await checkDownloadPermission(document.id);

    if (permissionCheck.hasPermission) {
      // Permission approved, download directly
      if (document.file_url) {
        window.open(document.file_url, "_blank");
        toast.success("Download started");
      }
    } else {
      // No permission, show request dialog
      setShowDownloadDialog(true);
    }
  };

  const handleBack = async () => {
    if (readingSessionId) {
      await endReadingSession(readingSessionId);
    }
    router.push("/dashboard/student/resources");
  };

  const formatReadingTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const getRemainingTime = (): string | null => {
    if (!document.time_limit_minutes) return null;
    const elapsedMinutes = Math.floor(readingTime / 60);
    const remaining = document.time_limit_minutes - elapsedMinutes;
    return remaining > 0 ? `${remaining} min remaining` : "Time limit exceeded";
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
              {document.time_limit_minutes && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {formatReadingTime(readingTime)} /{" "}
                    {document.time_limit_minutes} min
                  </span>
                  {getRemainingTime() && (
                    <span
                      className={`text-xs ${
                        timeLimitExceeded
                          ? "text-red-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      ({getRemainingTime()})
                    </span>
                  )}
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Request Download
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Time Limit Warning */}
      {timeLimitExceeded && (
        <Alert variant="destructive" className="mx-4 mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Time Limit Exceeded</AlertTitle>
          <AlertDescription>
            Your reading session has exceeded the time limit. You will be
            redirected in a few seconds.
          </AlertDescription>
        </Alert>
      )}

      {/* Document Info Bar */}
      <div className="border-b bg-muted/50 flex-shrink-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 text-sm">
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
            {maxAttempts !== null && (
              <div>
                <div className="text-muted-foreground font-medium mb-1">
                  Attempts
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span>
                    {attemptCount !== null ? attemptCount : "..."} /{" "}
                    {maxAttempts}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Preview */}
      <div className="flex-1 relative bg-background overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading document...</p>
            </div>
          </div>
        )}

        {/* {previewError && (
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
        )} */}

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
                      const images = contents.document.querySelectorAll("img");
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

      {/* Download Permission Request Dialog */}
      <RequestDownloadPermissionDialog
        open={showDownloadDialog}
        onOpenChange={setShowDownloadDialog}
        documentId={document.id}
        documentTitle={document.title}
      />
    </div>
  );
}

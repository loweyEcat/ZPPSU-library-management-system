"use client";

import * as React from "react";
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Eye,
  Download,
  FileText,
  Search,
  User,
  Calendar,
  BookOpen,
  File,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DocumentRestrictionDialog } from "./document-restriction-dialog";

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
  max_attempts?: number | null;
  student: {
    id: number;
    full_name: string;
    email: string;
    student_id: string | null;
  };
}

interface AdminPublishedDocumentsTableProps {
  documents: PublishedDocument[];
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

function getBookCoverColor(type: string | null): string {
  // All books use maroon color scheme
  return "bg-gradient-to-br from-[#800020] to-[#5C0014]";
}

function getDocumentTypeIcon(type: string | null) {
  switch (type) {
    case "Thesis":
      return <FileText className="h-5 w-5 text-blue-500" />;
    case "Journal":
      return <BookOpen className="h-5 w-5 text-purple-500" />;
    case "Capstone":
      return <File className="h-5 w-5 text-green-500" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
}

export function AdminPublishedDocumentsTable({
  documents,
}: AdminPublishedDocumentsTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [documentTypeFilter, setDocumentTypeFilter] =
    React.useState<string>("all");
  const [restrictionDialogOpen, setRestrictionDialogOpen] =
    React.useState(false);
  const [selectedDocument, setSelectedDocument] =
    React.useState<PublishedDocument | null>(null);

  // Filter documents
  const filteredDocuments = React.useMemo(() => {
    let filtered = documents;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.researcher_name.toLowerCase().includes(query) ||
          doc.student.full_name.toLowerCase().includes(query) ||
          doc.department?.toLowerCase().includes(query) ||
          doc.abstract?.toLowerCase().includes(query)
      );
    }

    if (documentTypeFilter !== "all") {
      filtered = filtered.filter(
        (doc) => doc.document_type === documentTypeFilter
      );
    }

    return filtered;
  }, [documents, searchQuery, documentTypeFilter]);

  const handlePreview = (document: PublishedDocument) => {
    router.push(`/admin/resources/${document.id}/preview`);
  };

  const handleDownload = (url: string, fileName: string) => {
    window.open(url, "_blank");
  };

  const handleRestrict = (doc: PublishedDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDocument(doc);
    setRestrictionDialogOpen(true);
  };

  const handleRestrictionSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .book-flip-container {
          transform-style: preserve-3d;
        }
        .book-flip-front,
        .book-flip-back {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .book-flip-back {
          transform: rotateY(180deg);
        }
        .group:hover .book-flip-inner {
          transform: rotateY(180deg);
        }
      `,
        }}
      />
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, researcher, student, department, or abstract..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={documentTypeFilter}
          onValueChange={setDocumentTypeFilter}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Thesis">Thesis</SelectItem>
            <SelectItem value="Journal">Journal</SelectItem>
            <SelectItem value="Capstone">Capstone</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {documents.length === 0
                ? "No published documents found"
                : "No documents match your search criteria"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="group cursor-pointer"
              onClick={() => handlePreview(doc)}
            >
              {/* Book Container with Flip Effect */}
              <div
                className="relative h-[320px] w-full max-w-[350px] mx-auto"
                style={{ perspective: "1000px" }}
              >
                <div
                  className="book-flip-container relative w-full h-full transition-transform duration-700 book-flip-inner"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Front Side - Book Cover */}
                  <div
                    className={`book-flip-front absolute inset-0 ${getBookCoverColor(
                      doc.document_type
                    )} rounded-r-lg shadow-2xl border-2`}
                    style={{ borderColor: "#FFD700" }}
                  >
                    {/* Book Spine Shadow */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/20 rounded-l-sm"></div>

                    {/* Book Cover Content */}
                    <div className="h-full flex flex-col p-4 text-white relative overflow-hidden">
                      {/* Decorative Lines */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20"></div>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20"></div>

                      {/* Book Title */}
                      <div className="flex-1 flex flex-col justify-center items-center text-center space-y-3">
                        <div className="w-12 h-12 mx-auto mb-2 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                          {getDocumentTypeIcon(doc.document_type)}
                        </div>
                        <h3 className="font-bold text-sm leading-tight line-clamp-4 drop-shadow-lg">
                          {doc.title}
                        </h3>
                      </div>

                      {/* Book Footer Info */}
                      <div className="mt-auto space-y-2 text-xs">
                        <div className="flex items-center justify-center gap-1 text-white/90">
                          <User className="h-3 w-3" />
                          <span className="truncate text-center">
                            {doc.researcher_name.split(" ")[0]}
                          </span>
                        </div>
                        <div className="text-center text-white/70 text-[10px]">
                          {formatDate(doc.published_at)}
                        </div>
                      </div>
                    </div>

                    {/* Book Pages Effect */}
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/10 rounded-r-lg"></div>
                  </div>

                  {/* Back Side - Book Details */}
                  <div
                    className="book-flip-back absolute inset-0 bg-gradient-to-br from-[#800020] to-[#5C0014] rounded-r-lg shadow-2xl border-2"
                    style={{ borderColor: "#FFD700" }}
                  >
                    {/* Book Spine Shadow */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/20 rounded-l-sm"></div>

                    {/* Book Back Content */}
                    <div className="h-full flex flex-col p-4 text-white relative overflow-hidden">
                      {/* Decorative Lines */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20"></div>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20"></div>

                      {/* Back Cover Title */}
                      <div className="mb-3">
                        <h3 className="font-bold text-xs leading-tight line-clamp-2 mb-2">
                          {doc.title}
                        </h3>
                        <div className="flex items-center justify-center mb-2">
                          {getDocumentTypeBadge(doc.document_type)}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 space-y-2 text-[10px] overflow-y-auto">
                        {doc.abstract && (
                          <div>
                            <p className="font-semibold mb-1 text-white/90">
                              Abstract
                            </p>
                            <p className="text-white/70 line-clamp-4 leading-relaxed">
                              {doc.abstract}
                            </p>
                          </div>
                        )}

                        <div className="space-y-1 pt-2 border-t border-white/10">
                          <div className="flex items-start gap-1.5">
                            <User className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-white/90">
                                Researcher
                              </p>
                              <p className="text-white/70 line-clamp-1">
                                {doc.researcher_name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-1.5">
                            <User className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-white/90">
                                Student
                              </p>
                              <p className="text-white/70 line-clamp-1">
                                {doc.student.full_name}
                                {doc.student.student_id &&
                                  ` (${doc.student.student_id})`}
                              </p>
                            </div>
                          </div>

                          {doc.department && (
                            <div className="flex items-start gap-1.5">
                              <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-white/90">
                                  Department
                                </p>
                                <p className="text-white/70">
                                  {doc.department}
                                </p>
                              </div>
                            </div>
                          )}

                          {(doc.academic_year || doc.semester) && (
                            <div className="flex items-start gap-1.5">
                              <Calendar className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-white/90">
                                  Academic Year
                                </p>
                                <p className="text-white/70">
                                  {doc.academic_year && doc.semester
                                    ? `${doc.academic_year} - ${doc.semester}`
                                    : doc.academic_year ||
                                      doc.semester ||
                                      "N/A"}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-start gap-1.5">
                            <File className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-white/90">
                                File Size
                              </p>
                              <p className="text-white/70">
                                {formatFileSize(doc.file_size)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Back Cover Footer */}
                      <div className="mt-auto pt-2 border-t border-white/10">
                        <div className="text-center text-white/70 text-[9px]">
                          Published: {formatDate(doc.published_at)}
                        </div>
                      </div>
                    </div>

                    {/* Book Pages Effect */}
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/10 rounded-r-lg"></div>
                  </div>
                </div>
              </div>

              {/* Book Info Below */}
              <div className="mt-3 text-center space-y-1">
                {/* <p className="text-sm font-medium line-clamp-1">{doc.title}</p>
                <div className="flex items-center justify-center gap-2">
                  {getDocumentTypeBadge(doc.document_type)}
                </div> */}
                <div className="flex items-center justify-between gap-2 mt-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 text-xs w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(doc);
                    }}
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    Read
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(doc.file_url, doc.file_name);
                    }}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={(e) => handleRestrict(doc, e)}
                  >
                    <Lock className="h-3 w-3" />
                    {doc.is_restricted ? "Unrestrict" : "Restrict"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {filteredDocuments.length > 0 && (
        <div className="text-sm text-muted-foreground text-center pt-4">
          Showing {filteredDocuments.length} of {documents.length} published
          document
          {documents.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Restriction Dialog */}
      {selectedDocument && (
        <DocumentRestrictionDialog
          open={restrictionDialogOpen}
          onOpenChange={setRestrictionDialogOpen}
          documentId={selectedDocument.id}
          isRestricted={selectedDocument.is_restricted || false}
          timeLimitMinutes={selectedDocument.time_limit_minutes || null}
          maxAttempts={selectedDocument.max_attempts || null}
          onSuccess={handleRestrictionSuccess}
        />
      )}
    </div>
  );
}

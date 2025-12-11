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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  Pencil,
  EyeOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DocumentRestrictionDialog } from "./document-restriction-dialog";
import { AdminEditDocumentDialog } from "./admin-edit-document-dialog";
import { toast } from "sonner";

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
  ebook_cover_image?: string | null;
  is_restricted?: boolean;
  is_hidden?: boolean;
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
  onRefresh?: () => void | Promise<void>;
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
    case "Ebooks":
      return <BookOpen className="h-5 w-5 text-orange-500" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
}

export function AdminPublishedDocumentsTable({
  documents,
  onRefresh,
}: AdminPublishedDocumentsTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [documentTypeFilter, setDocumentTypeFilter] =
    React.useState<string>("all");
  const [restrictionFilter, setRestrictionFilter] =
    React.useState<string>("all");
  const [restrictionDialogOpen, setRestrictionDialogOpen] =
    React.useState(false);
  const [selectedDocument, setSelectedDocument] =
    React.useState<PublishedDocument | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [hiddenFilter, setHiddenFilter] = React.useState<string>("all");

  // Pagination constants: 3 rows × 5 columns = 15 items per page
  const ITEMS_PER_PAGE = 15;

  // Filter documents
  const filteredDocuments = React.useMemo(() => {
    let filtered = documents;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const queryWords = query.split(/\s+/).filter((word) => word.length > 0);

      filtered = filtered.filter((doc) => {
        // Search in title
        const titleMatch = doc.title?.toLowerCase().includes(query);

        // Search in author (researcher_name)
        const authorMatch = doc.researcher_name?.toLowerCase().includes(query);

        // Search in abstract
        const abstractMatch = doc.abstract?.toLowerCase().includes(query);

        // Search in keywords
        const keywordsMatch = doc.keywords?.toLowerCase().includes(query);

        // Search in co_authors (for journals and ebooks)
        const coAuthorsMatch = doc.co_authors?.toLowerCase().includes(query);

        // For ebooks, parse co_authors JSON to search ISBN
        let isbnMatch = false;
        if (doc.document_type === "Ebooks" && doc.co_authors) {
          try {
            const ebookData = JSON.parse(doc.co_authors);
            if (ebookData.isbn) {
              isbnMatch = ebookData.isbn.toLowerCase().includes(query);
            }
          } catch (e) {
            // If parsing fails, ignore
          }
        }

        // If multiple words, check if all words appear somewhere (AND logic)
        if (queryWords.length > 1) {
          let allFields = [
            doc.title?.toLowerCase() || "",
            doc.researcher_name?.toLowerCase() || "",
            doc.abstract?.toLowerCase() || "",
            doc.keywords?.toLowerCase() || "",
            doc.co_authors?.toLowerCase() || "",
          ].join(" ");

          // For ebooks, also include ISBN in search
          if (doc.document_type === "Ebooks" && doc.co_authors) {
            try {
              const ebookData = JSON.parse(doc.co_authors);
              if (ebookData.isbn) {
                allFields += " " + ebookData.isbn.toLowerCase();
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }

          return queryWords.every((word) => allFields.includes(word));
        }

        // Single word or phrase search (OR logic across fields)
        return (
          titleMatch ||
          authorMatch ||
          abstractMatch ||
          keywordsMatch ||
          coAuthorsMatch ||
          isbnMatch
        );
      });
    }

    if (documentTypeFilter !== "all") {
      filtered = filtered.filter(
        (doc) => doc.document_type === documentTypeFilter
      );
    }

    // Restriction filter
    if (restrictionFilter !== "all") {
      if (restrictionFilter === "restricted") {
        filtered = filtered.filter((doc) => doc.is_restricted === true);
      } else if (restrictionFilter === "unrestricted") {
        filtered = filtered.filter((doc) => doc.is_restricted !== true);
      }
    }

    // Hidden filter
    if (hiddenFilter !== "all") {
      if (hiddenFilter === "hidden") {
        filtered = filtered.filter((doc) => doc.is_hidden === true);
      } else if (hiddenFilter === "visible") {
        filtered = filtered.filter((doc) => doc.is_hidden !== true);
      }
    }

    return filtered;
  }, [
    documents,
    searchQuery,
    documentTypeFilter,
    restrictionFilter,
    hiddenFilter,
  ]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, documentTypeFilter, restrictionFilter, hiddenFilter]);

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

  const handleEdit = (doc: PublishedDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDocument(doc);
    setEditDialogOpen(true);
  };

  const handleHide = async (doc: PublishedDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(
        `/api/admin/library/document/${doc.id}/toggle-visibility`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to toggle document visibility.");
        return;
      }

      toast.success(
        data.is_hidden
          ? "Document hidden successfully."
          : "Document made visible successfully."
      );
      router.refresh();
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error("Failed to toggle visibility:", error);
      toast.error("Network error. Please retry.");
    }
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
            placeholder="Search by title, author, abstract, keywords, co-authors, ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={documentTypeFilter}
          onValueChange={setDocumentTypeFilter}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Resources Types</SelectItem>
            <SelectItem value="Thesis">Thesis</SelectItem>
            <SelectItem value="Journal">Journal</SelectItem>
            <SelectItem value="Capstone">Capstone</SelectItem>
            <SelectItem value="Ebooks">Ebooks</SelectItem>
          </SelectContent>
        </Select>
        <Select value={restrictionFilter} onValueChange={setRestrictionFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by restriction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Files Restrictions</SelectItem>
            <SelectItem value="restricted">Restricted Files</SelectItem>
            <SelectItem value="unrestricted">Unrestricted Files</SelectItem>
          </SelectContent>
        </Select>
        <Select value={hiddenFilter} onValueChange={setHiddenFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Documents</SelectItem>
            <SelectItem value="visible">Visible Only</SelectItem>
            <SelectItem value="hidden">Hidden Only</SelectItem>
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {paginatedDocuments.map((doc) => (
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
                      className={`book-flip-front absolute inset-0 ${
                        (doc.document_type === "Ebooks" ||
                          doc.document_type === "Journal") &&
                        doc.ebook_cover_image
                          ? ""
                          : getBookCoverColor(doc.document_type)
                      } rounded-r-lg shadow-2xl border-2`}
                      style={{ borderColor: "#FFD700" }}
                    >
                      {/* Book Spine Shadow */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/20 rounded-l-sm"></div>

                      {/* Cover Image (Ebooks and Journals) */}
                      {(doc.document_type === "Ebooks" ||
                        doc.document_type === "Journal") &&
                      doc.ebook_cover_image ? (
                        <div className="h-full w-full relative overflow-hidden rounded-r-lg">
                          <img
                            src={doc.ebook_cover_image}
                            alt={doc.title}
                            className="w-full h-full object-cover"
                          />
                          {/* Overlay for better text readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                          {/* Book Cover Content Overlay */}
                          <div className="h-full flex flex-col p-4 text-white relative">
                            {/* Decorative Lines */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-white/20"></div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20"></div>

                            {/* Book Title */}
                            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-3">
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
                        </div>
                      ) : (
                        /* Book Cover Content - Default Gradient */
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
                      )}

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
                          {doc.document_type === "Journal" ? (
                            /* Journal Specific Details */
                            <div className="space-y-1">
                              <div className="flex items-start gap-1.5">
                                <BookOpen className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="font-semibold text-white/90">
                                    Article Title
                                  </p>
                                  <p className="text-white/70 line-clamp-2">
                                    {doc.title}
                                  </p>
                                </div>
                              </div>

                              {doc.journal_name && (
                                <div className="flex items-start gap-1.5">
                                  <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="font-semibold text-white/90">
                                      Journal Name
                                    </p>
                                    <p className="text-white/70 line-clamp-1">
                                      {doc.journal_name}
                                    </p>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-start gap-1.5">
                                <User className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="font-semibold text-white/90">
                                    Author
                                  </p>
                                  <p className="text-white/70 line-clamp-1">
                                    {doc.researcher_name}
                                  </p>
                                </div>
                              </div>

                              {doc.co_authors && (
                                <div className="flex items-start gap-1.5">
                                  <User className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="font-semibold text-white/90">
                                      Co-Authors
                                    </p>
                                    <p className="text-white/70 line-clamp-2">
                                      {doc.co_authors}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {(doc.journal_volume || doc.journal_issue) && (
                                <div className="flex items-start gap-1.5">
                                  <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="font-semibold text-white/90">
                                      Volume / Issue
                                    </p>
                                    <p className="text-white/70">
                                      {doc.journal_volume && doc.journal_issue
                                        ? `Vol. ${doc.journal_volume}, Issue ${doc.journal_issue}`
                                        : doc.journal_volume
                                        ? `Vol. ${doc.journal_volume}`
                                        : doc.journal_issue
                                        ? `Issue ${doc.journal_issue}`
                                        : "N/A"}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {doc.doi && (
                                <div className="flex items-start gap-1.5">
                                  <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="font-semibold text-white/90">
                                      DOI
                                    </p>
                                    <p className="text-white/70 line-clamp-1">
                                      {doc.doi}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {doc.abstract && (
                                <div className="pt-1 border-t border-white/10">
                                  <p className="font-semibold mb-1 text-white/90">
                                    Abstract
                                  </p>
                                  <p className="text-white/70 line-clamp-3 leading-relaxed">
                                    {doc.abstract}
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : doc.document_type === "Ebooks" ? (
                            /* Ebook Specific Details */
                            (() => {
                              let ebookData: {
                                isbn?: string | null;
                                publisher?: string | null;
                                publication_date?: string | null;
                                edition?: string | null;
                                language?: string | null;
                                category?: string | null;
                              } = {};

                              try {
                                if (doc.co_authors) {
                                  ebookData = JSON.parse(doc.co_authors);
                                }
                              } catch (e) {
                                // If parsing fails, use empty object
                              }

                              return (
                                <div className="space-y-1">
                                  <div className="flex items-start gap-1.5">
                                    <BookOpen className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="font-semibold text-white/90">
                                        Book Title
                                      </p>
                                      <p className="text-white/70 line-clamp-2">
                                        {doc.title}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-1.5">
                                    <User className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="font-semibold text-white/90">
                                        Author
                                      </p>
                                      <p className="text-white/70 line-clamp-1">
                                        {doc.researcher_name}
                                      </p>
                                    </div>
                                  </div>

                                  {ebookData.category && (
                                    <div className="flex items-start gap-1.5">
                                      <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <p className="font-semibold text-white/90">
                                          Genre
                                        </p>
                                        <p className="text-white/70">
                                          {ebookData.category}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {ebookData.language && (
                                    <div className="flex items-start gap-1.5">
                                      <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <p className="font-semibold text-white/90">
                                          Language
                                        </p>
                                        <p className="text-white/70">
                                          {ebookData.language}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {ebookData.publication_date && (
                                    <div className="flex items-start gap-1.5">
                                      <Calendar className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <p className="font-semibold text-white/90">
                                          Publication Date
                                        </p>
                                        <p className="text-white/70">
                                          {ebookData.publication_date}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {ebookData.edition && (
                                    <div className="flex items-start gap-1.5">
                                      <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <p className="font-semibold text-white/90">
                                          Edition
                                        </p>
                                        <p className="text-white/70">
                                          {ebookData.edition}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {ebookData.isbn && (
                                    <div className="flex items-start gap-1.5">
                                      <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <p className="font-semibold text-white/90">
                                          ISBN
                                        </p>
                                        <p className="text-white/70">
                                          {ebookData.isbn}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()
                          ) : (
                            /* Default Details for Other Document Types */
                            <>
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
                            </>
                          )}
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
                    {/* Edit button for Ebooks and Journals */}
                    {(doc.document_type === "Ebooks" ||
                      doc.document_type === "Journal") && (
                      <Button
                        variant="default"
                        size="sm"
                        className="h-8 text-xs flex-1"
                        onClick={(e) => handleEdit(doc, e)}
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                    )}
                    {/* Hide button for all document types */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs flex-1"
                      onClick={(e) => handleHide(doc, e)}
                    >
                      <EyeOff className="mr-1 h-3 w-3" />
                      {doc.is_hidden ? "Show" : "Hide"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={(e) => handleRestrict(doc, e)}
                    >
                      <Lock className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t">
              <div className="text-sm text-muted-foreground font-medium text-left">
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
                {filteredDocuments.length !== documents.length && (
                  <span className="ml-2">(of {documents.length} total)</span>
                )}
              </div>
              <div className="flex-shrink-0">
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
            </div>
          )}

          {/* Stats - Only show if no pagination */}
          {totalPages <= 1 && filteredDocuments.length > 0 && (
            <div className="text-sm text-muted-foreground text-center pt-4">
              Showing {filteredDocuments.length} of {documents.length} published
              document
              {documents.length !== 1 ? "s" : ""}
            </div>
          )}
        </>
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

      {/* Edit Dialog */}
      {selectedDocument &&
        (selectedDocument.document_type === "Ebooks" ||
          selectedDocument.document_type === "Journal") && (
          <AdminEditDocumentDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            document={selectedDocument}
            onSuccess={() => {
              setEditDialogOpen(false);
              setSelectedDocument(null);
              router.refresh();
              if (onRefresh) {
                onRefresh();
              }
            }}
          />
        )}
    </div>
  );
}

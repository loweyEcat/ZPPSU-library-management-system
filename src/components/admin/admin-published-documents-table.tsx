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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreVertical,
  Info,
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

function renderFirstPageContent(doc: PublishedDocument) {
  return (
    <div className="p-3 text-center space-y-2 w-full h-full flex flex-col justify-center">
      <div className="text-[10px] text-gray-700 space-y-1">
        <p className="font-bold text-xs mb-2">Document Information</p>
        <div className="flex items-center justify-center mb-2">
          {getDocumentTypeBadge(doc.document_type)}
        </div>
        <p className="font-semibold">Title:</p>
        <p className="line-clamp-3 text-[9px]">{doc.title}</p>
      </div>
    </div>
  );
}

function renderSecondPageContent(doc: PublishedDocument) {
  return (
    <div className="p-3 text-center space-y-2 w-full h-full flex flex-col justify-center">
      <div className="text-[9px] text-gray-700 space-y-1">
        <p className="font-bold text-xs mb-2">Author Details</p>
        <div className="flex items-center justify-center gap-1 mb-2">
          <User className="h-3 w-3" />
          <p className="font-semibold">Researcher:</p>
        </div>
        <p className="line-clamp-2">{doc.researcher_name}</p>
        {doc.student && (
          <>
            <div className="flex items-center justify-center gap-1 mt-2">
              <User className="h-3 w-3" />
              <p className="font-semibold">Student:</p>
            </div>
            <p className="line-clamp-1">
              {doc.student.full_name}
              {doc.student.student_id && ` (${doc.student.student_id})`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function renderThirdPageContent(doc: PublishedDocument) {
  return (
    <div className="p-3 text-center space-y-2 w-full h-full flex flex-col justify-center">
      <div className="text-[9px] text-gray-700 space-y-1">
        <p className="font-bold text-xs mb-2">Additional Info</p>
        {doc.department && (
          <div className="mb-1">
            <p className="font-semibold">Department:</p>
            <p className="line-clamp-1">{doc.department}</p>
          </div>
        )}
        {(doc.academic_year || doc.semester) && (
          <div className="mb-1">
            <p className="font-semibold">Academic Year:</p>
            <p className="line-clamp-1">
              {doc.academic_year && doc.semester
                ? `${doc.academic_year} - ${doc.semester}`
                : doc.academic_year || doc.semester || "N/A"}
            </p>
          </div>
        )}
        <div className="mt-2">
          <p className="font-semibold">File Size:</p>
          <p>{formatFileSize(doc.file_size)}</p>
        </div>
        {doc.document_type === "Journal" && doc.journal_name && (
          <div className="mt-2">
            <p className="font-semibold">Journal:</p>
            <p className="line-clamp-1 text-[8px]">{doc.journal_name}</p>
          </div>
        )}
        {doc.document_type === "Ebooks" &&
          doc.co_authors &&
          (() => {
            try {
              const ebookData = JSON.parse(doc.co_authors);
              return (
                <>
                  {ebookData.category && (
                    <div className="mt-2">
                      <p className="font-semibold">Genre:</p>
                      <p className="text-[8px]">{ebookData.category}</p>
                    </div>
                  )}
                  {ebookData.isbn && (
                    <div className="mt-2">
                      <p className="font-semibold">ISBN:</p>
                      <p className="text-[8px]">{ebookData.isbn}</p>
                    </div>
                  )}
                </>
              );
            } catch {
              return null;
            }
          })()}
      </div>
    </div>
  );
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
  const [detailsDialogOpen, setDetailsDialogOpen] = React.useState(false);

  // Pagination constants: 3 rows × 6 columns = 18 items per page
  const ITEMS_PER_PAGE = 18;

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

  // Group documents into rows
  const documentRows = React.useMemo(() => {
    const itemsPerRow = 6;
    const rows: PublishedDocument[][] = [];
    for (let i = 0; i < paginatedDocuments.length; i += itemsPerRow) {
      rows.push(paginatedDocuments.slice(i, i + itemsPerRow));
    }
    return rows;
  }, [paginatedDocuments]);

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

  const handleViewDetails = (doc: PublishedDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDocument(doc);
    setDetailsDialogOpen(true);
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
        .book-container {
          margin: auto;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 400px;
          perspective: 500px;
          perspective-origin: 50% 50%;
        }
        
        .book-item {
          position: relative;
          width: 180px;
          height: 240px;
          transform-style: preserve-3d;
        }
        
        .book-shadow {
          position: absolute;
          bottom: 0;
          width: 190px;
          box-shadow: 0 8px 16px 8px gray;
          transform: rotateY(-10deg);
        }
        
        .book-item > div {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transform-origin: left;
          transition: transform 0.4s ease-in-out;
        }
        
        .book-cover {
          transform: scaleY(1.05) rotateY(-10deg);
         border: 1px solid #FFD700;
          overflow: hidden;
        }
        
        .book-cover-end {
          transform: translateX(10px) rotateY(-10deg);
         border: 1px solid #FFD700;
          background-color: rgb(208, 213, 213);
        }
        
        .book-back {
          height: 240px;
          width: 10px;
          background-color: rgb(208, 213, 213);
        }
        
        .book-page {
          background: linear-gradient(to right, rgb(208, 213, 213), 20%, rgb(249, 255, 255));
          border: 1px solid #FFD700;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 0;
          backface-visibility: visible;
          -webkit-backface-visibility: visible;
        }
        
        .book-page > div {
          width: 100%;
          height: 100%;
          backface-visibility: visible;
          -webkit-backface-visibility: visible;
        }
        
        .book-shelf-divider {
          grid-column: 1 / -1;
          height: 50px;
          position: relative;
          margin: -30px 0;
          transform-style: preserve-3d;
          perspective: 1000px;
          transform: skew(-10deg, 0deg);
          box-shadow: 
            0 -25px 40px -5px rgba(0, 0, 0, 0.4),
            0 -20px 30px -8px rgba(0, 0, 0, 0.3),
            0 -15px 20px -10px rgba(0, 0, 0, 0.25),
            0 -10px 15px -12px rgba(0, 0, 0, 0.2),
            0 -5px 10px -15px rgba(0, 0, 0, 0.15),
            0 -2px 5px -18px rgba(0, 0, 0, 0.1);
        }
        
        .book-shelf-divider::before {
          content: '';
          position: absolute;
          top: 0;
          left: -10px;
          right: -10px;
          height: 5px;
          background: linear-gradient(to bottom, 
            rgba(184, 134, 11, 0.95) 0%,
            rgba(139, 69, 19, 0.95) 30%,
            rgba(101, 67, 33, 0.95) 70%,
            rgba(139, 69, 19, 0.95) 100%);
          border-radius: 3px 3px 0 0;
          box-shadow: 
            0 3px 6px rgba(0, 0, 0, 0.4),
            inset 0 2px 4px rgba(255, 255, 255, 0.15),
            inset 0 -1px 2px rgba(0, 0, 0, 0.2);
          transform: perspective(1000px) rotateX(8deg);
          border: 1px solid rgba(101, 67, 33, 0.8);
        }
        
        .book-shelf-divider::after {
          content: '';
          position: absolute;
          top: 5px;
          left: -10px;
          right: -10px;
          height: 9px;
          background: linear-gradient(to bottom,
            rgba(160, 82, 45, 0.85) 0%,
            rgba(139, 69, 19, 0.9) 50%,
            rgba(101, 67, 33, 0.95) 100%);
          border-radius: 0 0 5px 5px;
          box-shadow: 
            0 6px 12px rgba(0, 0, 0, 0.5),
            inset 0 -3px 6px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          border-left: 1px solid rgba(101, 67, 33, 0.6);
          border-right: 1px solid rgba(101, 67, 33, 0.6);
          border-bottom: 1px solid rgba(101, 67, 33, 0.8);
        }
        
        .book-row-wrapper {
          position: relative;
          display: flex;
          align-items: stretch;
        }
        
        .book-row-divider-left,
        .book-row-divider-right {
          width: 14px;
          flex-shrink: 0;
          position: relative;
          transform-style: preserve-3d;
          perspective: 1000px;
          transform: skew(0deg, -4deg);
          z-index: 5;
          background: linear-gradient(to right,
            rgba(160, 82, 45, 0.85) 0%,
            rgba(139, 69, 19, 0.9) 50%,
            rgba(101, 67, 33, 0.95) 100%);
          box-shadow: 
            3px 0 6px rgba(0, 0, 0, 0.4),
            inset 2px 0 4px rgba(255, 255, 255, 0.15),
            inset -1px 0 2px rgba(0, 0, 0, 0.2),
            6px 0 12px rgba(0, 0, 0, 0.5);
          border-left: 1px solid rgba(101, 67, 33, 0.8);
          border-top: 1px solid rgba(101, 67, 33, 0.6);
          border-bottom: 1px solid rgba(101, 67, 33, 0.8);
          pointer-events: none;
        }
        
        .book-row-divider-left {
          border-radius: 3px 0 0 3px;
        }
        
        .book-row-divider-right {
          border-radius: 0 3px 3px 0;
          background: linear-gradient(to left,
            rgba(160, 82, 45, 0.85) 0%,
            rgba(139, 69, 19, 0.9) 50%,
            rgba(101, 67, 33, 0.95) 100%);
          box-shadow: 
            -3px 0 6px rgba(0, 0, 0, 0.4),
            inset -2px 0 4px rgba(255, 255, 255, 0.15),
            inset 1px 0 2px rgba(0, 0, 0, 0.2),
            -6px 0 12px rgba(0, 0, 0, 0.5);
          border-right: 1px solid rgba(101, 67, 33, 0.8);
          border-left: none;
        }
        
        .book-row-wrapper > div:not(.book-row-divider-left):not(.book-row-divider-right) {
          flex: 1;
        }
        
        .book-page.first {
          transform: translateX(2px) rotateY(-10deg);
        }
        
        .book-page.second {
          transform: translateX(4px) rotateY(-10deg);
        }
        
        .book-page.third {
          transform: translateX(6px) rotateY(-10deg);
        }
        
        .book-page.last {
          transform: translateX(8px) rotateY(-10deg);
        }
        
        .book-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: right top;
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
            <SelectItem value="all">All Resources</SelectItem>
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
            <SelectItem value="all">Restricted Resources</SelectItem>
            <SelectItem value="restricted">Restricted Files</SelectItem>
            <SelectItem value="unrestricted">Unrestricted Files</SelectItem>
          </SelectContent>
        </Select>
        <Select value={hiddenFilter} onValueChange={setHiddenFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hidden Resources</SelectItem>
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
          <div className="space-y-0">
            {documentRows.map((row, rowIndex) => (
              <div key={rowIndex} className="relative">
                {rowIndex > 0 && <div className="book-shelf-divider" />}
                <div className="book-row-wrapper relative">
                  <div className="book-row-divider-left"></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-0.5">
                    {row.map((doc) => (
                      <div
                        key={doc.id}
                        className="group cursor-pointer"
                        onClick={() => handlePreview(doc)}
                      >
                        {/* Book Container */}
                        <div className="book-container">
                          <div className="book-item">
                            {/* Shadow */}
                            <span className="book-shadow"></span>

                            {/* Back (Spine) */}
                            <div className="book-back"></div>

                            {/* Cover End */}
                            <div className="book-cover-end"></div>

                            {/* Last Page - Details */}
                            <div className="book-page last">
                              <div className="p-3 text-center space-y-2 w-full h-full flex flex-col justify-center">
                                <h3 className="font-bold text-xs leading-tight line-clamp-2 mb-2">
                                  {doc.title}
                                </h3>
                                <div className="flex items-center justify-center mb-2">
                                  {getDocumentTypeBadge(doc.document_type)}
                                </div>
                                <div className="text-[9px] text-gray-700 space-y-1">
                                  <p className="font-semibold">Author:</p>
                                  <p className="line-clamp-1">
                                    {doc.researcher_name}
                                  </p>
                                  {doc.abstract && (
                                    <div className="mt-2 pt-2 border-t border-gray-300">
                                      <p className="font-semibold mb-1">
                                        Abstract:
                                      </p>
                                      <p className="line-clamp-3 text-[8px] leading-tight">
                                        {doc.abstract}
                                      </p>
                                    </div>
                                  )}
                                  <p className="text-[8px] mt-2">
                                    Published: {formatDate(doc.published_at)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Third Page */}
                            <div className="book-page third">
                              {renderThirdPageContent(doc)}
                            </div>

                            {/* Second Page */}
                            <div className="book-page second">
                              {renderSecondPageContent(doc)}
                            </div>

                            {/* First Page */}
                            <div className="book-page first">
                              {renderFirstPageContent(doc)}
                            </div>

                            {/* Cover */}
                            <div
                              className={`book-cover relative ${
                                (doc.document_type === "Ebooks" ||
                                  doc.document_type === "Journal") &&
                                doc.ebook_cover_image
                                  ? ""
                                  : getBookCoverColor(doc.document_type)
                              }`}
                            >
                              {/* Dropdown Menu - Top Left Corner */}
                              <div
                                className="absolute top-2 left-2 z-[100]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 bg-white/95 hover:bg-white shadow-md border border-gray-200 rounded-full"
                                    >
                                      <MoreVertical className="h-4 w-4 text-gray-700" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="start"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* View Details option */}
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewDetails(doc, e);
                                      }}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    {/* Edit option for Ebooks and Journals */}
                                    {(doc.document_type === "Ebooks" ||
                                      doc.document_type === "Journal") && (
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEdit(doc, e);
                                        }}
                                      >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                    )}
                                    {/* Hide/Show option */}
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleHide(doc, e);
                                      }}
                                    >
                                      <EyeOff className="mr-2 h-4 w-4" />
                                      {doc.is_hidden ? "Show" : "Hide"}
                                    </DropdownMenuItem>
                                    {/* Restrict option */}
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRestrict(doc, e);
                                      }}
                                    >
                                      <Lock className="mr-2 h-4 w-4" />
                                      Restrictions
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              {/* Restricted Indicator - Top Right Corner */}
                              {doc.is_restricted && (
                                <div className="absolute top-2 right-2 z-[90]">
                                  <div className="bg-yellow-500/90 hover:bg-yellow-500 shadow-lg border-2 border-yellow-400 rounded-full p-2">
                                    <Lock className="h-3 w-3 text-white" />
                                  </div>
                                </div>
                              )}
                              {(doc.document_type === "Ebooks" ||
                                doc.document_type === "Journal") &&
                              doc.ebook_cover_image ? (
                                <img
                                  src={doc.ebook_cover_image}
                                  alt={doc.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="h-full flex flex-col p-4 text-white relative overflow-hidden">
                                  <div className="flex-1 flex flex-col justify-center items-center text-center space-y-3">
                                    <div className="w-12 h-12 mx-auto mb-2 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                      {getDocumentTypeIcon(doc.document_type)}
                                    </div>
                                    <h3 className="font-bold text-sm leading-tight line-clamp-4 drop-shadow-lg">
                                      {doc.title}
                                    </h3>
                                  </div>
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
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="book-row-divider-right"></div>
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

      {/* Details Dialog */}
      {selectedDocument && (
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Document Details
              </DialogTitle>
              <DialogDescription>
                Complete information about the selected document
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Title
                    </p>
                    <p className="text-sm font-semibold">
                      {selectedDocument.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Document Type
                    </p>
                    <div className="mt-1">
                      {getDocumentTypeBadge(selectedDocument.document_type)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Researcher/Author
                    </p>
                    <p className="text-sm">
                      {selectedDocument.researcher_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Status
                    </p>
                    <p className="text-sm">{selectedDocument.status}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Submission Status
                    </p>
                    <p className="text-sm">
                      {selectedDocument.submission_status}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      File Name
                    </p>
                    <p className="text-sm">{selectedDocument.file_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      File Size
                    </p>
                    <p className="text-sm">
                      {formatFileSize(selectedDocument.file_size)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      File Type
                    </p>
                    <p className="text-sm">{selectedDocument.file_type}</p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Dates</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Submitted At
                    </p>
                    <p className="text-sm">
                      {formatDate(selectedDocument.submitted_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Approved At
                    </p>
                    <p className="text-sm">
                      {formatDate(selectedDocument.approved_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Published At
                    </p>
                    <p className="text-sm">
                      {formatDate(selectedDocument.published_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Student Information */}
              {selectedDocument.student && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Student Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Student Name
                      </p>
                      <p className="text-sm">
                        {selectedDocument.student.full_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Student ID
                      </p>
                      <p className="text-sm">
                        {selectedDocument.student.student_id || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Email
                      </p>
                      <p className="text-sm">
                        {selectedDocument.student.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Academic Information */}
              {(selectedDocument.department ||
                selectedDocument.academic_year ||
                selectedDocument.semester ||
                selectedDocument.year_level ||
                selectedDocument.program) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Academic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDocument.department && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Department
                        </p>
                        <p className="text-sm">{selectedDocument.department}</p>
                      </div>
                    )}
                    {selectedDocument.program && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Program
                        </p>
                        <p className="text-sm">{selectedDocument.program}</p>
                      </div>
                    )}
                    {selectedDocument.academic_year && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Academic Year
                        </p>
                        <p className="text-sm">
                          {selectedDocument.academic_year}
                        </p>
                      </div>
                    )}
                    {selectedDocument.semester && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Semester
                        </p>
                        <p className="text-sm">{selectedDocument.semester}</p>
                      </div>
                    )}
                    {selectedDocument.year_level && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Year Level
                        </p>
                        <p className="text-sm">{selectedDocument.year_level}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Document Type Specific Information */}
              {selectedDocument.document_type === "Journal" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Journal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDocument.journal_name && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Journal Name
                        </p>
                        <p className="text-sm">
                          {selectedDocument.journal_name}
                        </p>
                      </div>
                    )}
                    {selectedDocument.journal_volume && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Volume
                        </p>
                        <p className="text-sm">
                          {selectedDocument.journal_volume}
                        </p>
                      </div>
                    )}
                    {selectedDocument.journal_issue && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Issue
                        </p>
                        <p className="text-sm">
                          {selectedDocument.journal_issue}
                        </p>
                      </div>
                    )}
                    {selectedDocument.doi && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          DOI
                        </p>
                        <p className="text-sm">{selectedDocument.doi}</p>
                      </div>
                    )}
                    {selectedDocument.co_authors && (
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Co-Authors
                        </p>
                        <p className="text-sm">{selectedDocument.co_authors}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedDocument.document_type === "Ebooks" &&
                selectedDocument.co_authors && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">
                      Ebook Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(() => {
                        try {
                          const ebookData = JSON.parse(
                            selectedDocument.co_authors
                          );
                          return (
                            <>
                              {ebookData.isbn && (
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">
                                    ISBN
                                  </p>
                                  <p className="text-sm">{ebookData.isbn}</p>
                                </div>
                              )}
                              {ebookData.publisher && (
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">
                                    Publisher
                                  </p>
                                  <p className="text-sm">
                                    {ebookData.publisher}
                                  </p>
                                </div>
                              )}
                              {ebookData.publication_date && (
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">
                                    Publication Date
                                  </p>
                                  <p className="text-sm">
                                    {ebookData.publication_date}
                                  </p>
                                </div>
                              )}
                              {ebookData.edition && (
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">
                                    Edition
                                  </p>
                                  <p className="text-sm">{ebookData.edition}</p>
                                </div>
                              )}
                              {ebookData.language && (
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">
                                    Language
                                  </p>
                                  <p className="text-sm">
                                    {ebookData.language}
                                  </p>
                                </div>
                              )}
                              {ebookData.category && (
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">
                                    Category/Genre
                                  </p>
                                  <p className="text-sm">
                                    {ebookData.category}
                                  </p>
                                </div>
                              )}
                            </>
                          );
                        } catch {
                          return null;
                        }
                      })()}
                    </div>
                  </div>
                )}

              {/* Abstract */}
              {selectedDocument.abstract && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Abstract
                  </h3>
                  <p className="text-sm leading-relaxed">
                    {selectedDocument.abstract}
                  </p>
                </div>
              )}

              {/* Keywords */}
              {selectedDocument.keywords && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Keywords
                  </h3>
                  <p className="text-sm">{selectedDocument.keywords}</p>
                </div>
              )}

              {/* Additional Information */}
              {(selectedDocument.adviser_name ||
                selectedDocument.project_type ||
                selectedDocument.capstone_category) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDocument.adviser_name && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Adviser Name
                        </p>
                        <p className="text-sm">
                          {selectedDocument.adviser_name}
                        </p>
                      </div>
                    )}
                    {selectedDocument.project_type && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Project Type
                        </p>
                        <p className="text-sm">
                          {selectedDocument.project_type}
                        </p>
                      </div>
                    )}
                    {selectedDocument.capstone_category && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Capstone Category
                        </p>
                        <p className="text-sm">
                          {selectedDocument.capstone_category}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Restrictions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Restrictions & Visibility
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Is Restricted
                    </p>
                    <p className="text-sm">
                      {selectedDocument.is_restricted ? "Yes" : "No"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Is Hidden
                    </p>
                    <p className="text-sm">
                      {selectedDocument.is_hidden ? "Yes" : "No"}
                    </p>
                  </div>
                  {selectedDocument.time_limit_minutes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Time Limit (Minutes)
                      </p>
                      <p className="text-sm">
                        {selectedDocument.time_limit_minutes} minutes
                      </p>
                    </div>
                  )}
                  {selectedDocument.max_attempts && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Max Attempts
                      </p>
                      <p className="text-sm">{selectedDocument.max_attempts}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

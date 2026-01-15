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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  User,
  FileText,
  Calendar,
  Download,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateDownloadPermission } from "@/app/admin/documents/actions";
import type { DownloadPermissionRequest } from "@/app/admin/documents/actions";

interface DownloadRequestTableProps {
  requests: DownloadPermissionRequest[];
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
}

function getStatusBadge(status: string): React.ReactElement {
  switch (status) {
    case "Pending":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case "Approved":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    case "Rejected":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
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

export function DownloadRequestTable({
  requests: initialRequests,
}: DownloadRequestTableProps) {
  const router = useRouter();
  const [requests, setRequests] = React.useState(initialRequests);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [isProcessing, setIsProcessing] = React.useState<number | null>(null);

  const handleApprove = async (requestId: number) => {
    setIsProcessing(requestId);
    try {
      const result = await updateDownloadPermission(requestId, "Approved");
      if (result.success) {
        toast.success(result.message);
        // Update local state
        setRequests((prev) =>
          prev.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  status: "Approved",
                  reviewed_at: new Date().toISOString(),
                }
              : req
          )
        );
        router.refresh();
      } else {
        toast.error(result.error || "Failed to approve request");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("An error occurred while approving the request");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (requestId: number) => {
    setIsProcessing(requestId);
    try {
      const result = await updateDownloadPermission(requestId, "Rejected");
      if (result.success) {
        toast.success(result.message);
        // Update local state
        setRequests((prev) =>
          prev.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  status: "Rejected",
                  reviewed_at: new Date().toISOString(),
                }
              : req
          )
        );
        router.refresh();
      } else {
        toast.error(result.error || "Failed to reject request");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("An error occurred while rejecting the request");
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.student.full_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      request.student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.document.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (request.student.student_id &&
        request.student.student_id
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const approvedCount = requests.filter((r) => r.status === "Approved").length;
  const rejectedCount = requests.filter((r) => r.status === "Rejected").length;

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Requests
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <CardDescription>Awaiting review</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <CardDescription>Granted access</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
            <CardDescription>Denied access</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Viewing Permission Requests</CardTitle>
          <CardDescription>
            Review and manage student view requests for resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by student name, email, student ID, or document title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Requests List */}
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No viewing requests found</p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      {/* Left Section - Request Info */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusBadge(request.status)}
                              {getDocumentTypeBadge(
                                request.document.document_type
                              )}
                            </div>
                            <h3 className="font-semibold text-lg mb-1">
                              {request.document.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {request.document.file_name}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Student:{" "}
                            </span>
                            <span className="font-medium">
                              {request.student.full_name}
                              {request.student.student_id &&
                                ` (${request.student.student_id})`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Email:{" "}
                            </span>
                            <span className="font-medium">
                              {request.student.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Requested:{" "}
                            </span>
                            <span className="font-medium">
                              {formatDate(request.requested_at)}
                            </span>
                          </div>
                          {request.reviewed_at && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Reviewed:{" "}
                              </span>
                              <span className="font-medium">
                                {formatDate(request.reviewed_at)}
                              </span>
                            </div>
                          )}
                        </div>

                        {request.reason && (
                          <div className="p-3 bg-muted/50 rounded-md">
                            <p className="text-sm font-medium mb-1">Reason:</p>
                            <p className="text-sm text-muted-foreground">
                              {request.reason}
                            </p>
                          </div>
                        )}

                        {request.reviewed_by && (
                          <div className="text-sm text-muted-foreground">
                            Reviewed by:{" "}
                            <span className="font-medium">
                              {request.reviewed_by.full_name}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/admin/resources/${request.document_id}/preview`
                            )
                          }
                          className="w-full sm:w-auto lg:w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Document
                        </Button>
                        {request.status === "Pending" && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(request.id)}
                              disabled={isProcessing === request.id}
                              className="w-full sm:w-auto lg:w-full bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {isProcessing === request.id
                                ? "Processing..."
                                : "Approve"}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReject(request.id)}
                              disabled={isProcessing === request.id}
                              className="w-full sm:w-auto lg:w-full"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              {isProcessing === request.id
                                ? "Processing..."
                                : "Reject"}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

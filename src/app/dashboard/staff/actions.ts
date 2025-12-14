"use server";

import { prisma } from "@/lib/prisma";
import { requireStaffOrAbove } from "@/lib/auth-library";

export interface StaffDashboardStats {
  assignedDocuments: number;
  pendingReviews: number;
  reviewedDocuments: number;
  approvedDocuments: number;
  rejectedDocuments: number;
  revisionRequired: number;
  bookRequests: number;
  pendingBookRequests: number;
  averageReviewTime: number;
}

export interface DocumentTypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface MonthlyReviewActivity {
  month: string;
  reviews: number;
  year: number;
}

export interface DocumentTypeByStatus {
  type: string;
  pending: number;
  approved: number;
  rejected: number;
  revision: number;
}

export async function getStaffDashboardStats(): Promise<StaffDashboardStats> {
  const session = await requireStaffOrAbove();

  // Get all documents assigned to this staff member
  const documents = await prisma.lib_thesis_documents.findMany({
    where: {
      assigned_staff_id: session.user.id,
    },
    select: {
      id: true,
      submission_status: true,
      status: true,
      staff_reviewed_at: true,
      submitted_at: true,
    },
  });

  // Get book requests assigned to this staff member
  const bookRequests = await prisma.lib_book_requests.findMany({
    where: {
      staff_id: session.user.id,
    },
    select: {
      id: true,
      status: true,
    },
  });

  const assignedDocuments = documents.length;
  const pendingReviews = documents.filter(
    (d) =>
      d.submission_status === "Under_Review" ||
      d.status === "Pending" ||
      d.status === "Under_Review"
  ).length;
  const reviewedDocuments = documents.filter(
    (d) => d.staff_reviewed_at !== null
  ).length;
  const approvedDocuments = documents.filter(
    (d) => d.submission_status === "Staff_Approved"
  ).length;
  const rejectedDocuments = documents.filter(
    (d) => d.submission_status === "Staff_Rejected"
  ).length;
  const revisionRequired = documents.filter(
    (d) => d.submission_status === "Revision_Requested"
  ).length;

  const pendingBookRequests = bookRequests.filter(
    (br) => br.status === "Pending" || br.status === "Under_Review"
  ).length;

  // Calculate average review time (in days)
  const reviewedDocs = documents.filter((d) => d.staff_reviewed_at !== null);
  let averageReviewTime = 0;
  if (reviewedDocs.length > 0) {
    const totalDays = reviewedDocs.reduce((sum, doc) => {
      if (doc.staff_reviewed_at && doc.submitted_at) {
        const submitted = new Date(doc.submitted_at);
        const reviewed = new Date(doc.staff_reviewed_at);
        const days = Math.ceil(
          (reviewed.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }
      return sum;
    }, 0);
    averageReviewTime = totalDays / reviewedDocs.length;
  }

  return {
    assignedDocuments,
    pendingReviews,
    reviewedDocuments,
    approvedDocuments,
    rejectedDocuments,
    revisionRequired,
    bookRequests: bookRequests.length,
    pendingBookRequests,
    averageReviewTime: Math.round(averageReviewTime * 10) / 10,
  };
}

export async function getDocumentTypeDistribution(): Promise<
  DocumentTypeDistribution[]
> {
  const session = await requireStaffOrAbove();

  const documents = await prisma.lib_thesis_documents.findMany({
    where: {
      assigned_staff_id: session.user.id,
    },
    select: { document_type: true },
  });

  const typeMap = new Map<string, number>();
  documents.forEach((doc) => {
    const type = doc.document_type || "Unknown";
    typeMap.set(type, (typeMap.get(type) || 0) + 1);
  });

  const total = documents.length;
  const distribution: DocumentTypeDistribution[] = Array.from(
    typeMap.entries()
  ).map(([type, count]) => ({
    type,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0,
  }));

  return distribution.sort((a, b) => b.count - a.count);
}

export async function getStatusDistribution(): Promise<StatusDistribution[]> {
  const session = await requireStaffOrAbove();

  const documents = await prisma.lib_thesis_documents.findMany({
    where: {
      assigned_staff_id: session.user.id,
    },
    select: { submission_status: true, status: true },
  });

  const statusMap = new Map<string, number>();
  documents.forEach((doc) => {
    const status =
      doc.submission_status || doc.status || "Unknown";
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });

  const total = documents.length;
  const distribution: StatusDistribution[] = Array.from(statusMap.entries()).map(
    ([status, count]) => ({
      status: status.replace(/_/g, " "),
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    })
  );

  return distribution.sort((a, b) => b.count - a.count);
}

export async function getMonthlyReviewActivity(): Promise<
  MonthlyReviewActivity[]
> {
  const session = await requireStaffOrAbove();

  const documents = await prisma.lib_thesis_documents.findMany({
    where: {
      assigned_staff_id: session.user.id,
      staff_reviewed_at: { not: null },
    },
    select: { staff_reviewed_at: true },
    orderBy: { staff_reviewed_at: "asc" },
  });

  const monthMap = new Map<string, number>();

  documents.forEach((doc) => {
    if (doc.staff_reviewed_at) {
      const date = new Date(doc.staff_reviewed_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
    }
  });

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const activity: MonthlyReviewActivity[] = Array.from(monthMap.entries())
    .map(([key, count]) => {
      const [year, month] = key.split("-");
      return {
        month: monthNames[parseInt(month) - 1],
        reviews: count,
        year: parseInt(year),
      };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
    });

  // Get last 6 months
  return activity.slice(-6);
}

export async function getDocumentTypeByStatus(): Promise<
  DocumentTypeByStatus[]
> {
  const session = await requireStaffOrAbove();

  const documents = await prisma.lib_thesis_documents.findMany({
    where: {
      assigned_staff_id: session.user.id,
    },
    select: {
      document_type: true,
      submission_status: true,
      status: true,
    },
  });

  const typeMap = new Map<
    string,
    { pending: number; approved: number; rejected: number; revision: number }
  >();

  documents.forEach((doc) => {
    const type = doc.document_type || "Unknown";
    const current = typeMap.get(type) || {
      pending: 0,
      approved: 0,
      rejected: 0,
      revision: 0,
    };

    const status =
      doc.submission_status || doc.status || "Unknown";
    const statusLower = status.toLowerCase();

    if (
      statusLower.includes("pending") ||
      statusLower.includes("under review")
    ) {
      current.pending++;
    } else if (statusLower.includes("approved")) {
      current.approved++;
    } else if (statusLower.includes("rejected")) {
      current.rejected++;
    } else if (statusLower.includes("revision")) {
      current.revision++;
    }

    typeMap.set(type, current);
  });

  return Array.from(typeMap.entries()).map(([type, counts]) => ({
    type,
    ...counts,
  }));
}


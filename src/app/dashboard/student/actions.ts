"use server";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-library";

export interface DashboardStats {
  totalDocuments: number;
  approvedDocuments: number;
  pendingDocuments: number;
  rejectedDocuments: number;
  publishedDocuments: number;
  revisionRequired: number;
  totalFileSize: number;
  averageReviewTime: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface MonthlySubmission {
  month: string;
  count: number;
  year: number;
}

export async function getStudentDashboardStats() {
  const session = await requireStudent();

  const documents = await prisma.lib_thesis_documents.findMany({
    where: {
      student_id: session.user.id,
    },
    select: {
      id: true,
      status: true,
      submission_status: true,
      file_size: true,
      submitted_at: true,
      staff_reviewed_at: true,
      admin_reviewed_at: true,
      approved_at: true,
      published_at: true,
    },
  });

  const stats: DashboardStats = {
    totalDocuments: documents.length,
    approvedDocuments: documents.filter(
      (d) => d.submission_status === "Super_Admin_Approved"
    ).length,
    pendingDocuments: documents.filter(
      (d) =>
        d.status === "Pending" ||
        d.status === "Under_Review" ||
        d.submission_status === "Under_Review"
    ).length,
    rejectedDocuments: documents.filter(
      (d) =>
        d.submission_status === "Staff_Rejected" ||
        d.submission_status === "Super_Admin_Rejected" ||
        d.status === "Rejected"
    ).length,
    publishedDocuments: documents.filter(
      (d) => d.submission_status === "Published"
    ).length,
    revisionRequired: documents.filter(
      (d) =>
        d.submission_status === "Revision_Requested" ||
        d.status === "Revision_Required"
    ).length,
    totalFileSize: documents.reduce((sum, d) => sum + d.file_size, 0),
    averageReviewTime: 0,
  };

  // Calculate average review time (in days)
  const reviewedDocs = documents.filter(
    (d) => d.staff_reviewed_at || d.admin_reviewed_at
  );
  if (reviewedDocs.length > 0) {
    const totalDays = reviewedDocs.reduce((sum, doc) => {
      const submitted = new Date(doc.submitted_at).getTime();
      const reviewed = doc.admin_reviewed_at
        ? new Date(doc.admin_reviewed_at).getTime()
        : doc.staff_reviewed_at
        ? new Date(doc.staff_reviewed_at).getTime()
        : submitted;
      const days = (reviewed - submitted) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    stats.averageReviewTime = Math.round((totalDays / reviewedDocs.length) * 10) / 10;
  }

  return stats;
}

export async function getStatusDistribution(): Promise<StatusDistribution[]> {
  const session = await requireStudent();

  const documents = await prisma.lib_thesis_documents.findMany({
    where: {
      student_id: session.user.id,
    },
    select: {
      status: true,
      submission_status: true,
    },
  });

  const statusMap = new Map<string, number>();

  documents.forEach((doc) => {
    let status = doc.submission_status;
    if (status === "Staff_Approved") status = "Staff Verified";
    else if (status === "Super_Admin_Approved") status = "Approved";
    else if (status === "Staff_Rejected" || status === "Super_Admin_Rejected")
      status = "Rejected";
    else if (status === "Revision_Requested") status = "Revision Required";
    else if (status === "Published") status = "Published";
    else if (status === "Under_Review") status = "Under Review";
    else status = doc.status.replace(/_/g, " ");

    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });

  const total = documents.length;
  const distribution: StatusDistribution[] = Array.from(statusMap.entries()).map(
    ([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    })
  );

  return distribution.sort((a, b) => b.count - a.count);
}

export async function getMonthlySubmissions(): Promise<MonthlySubmission[]> {
  const session = await requireStudent();

  const documents = await prisma.lib_thesis_documents.findMany({
    where: {
      student_id: session.user.id,
    },
    select: {
      submitted_at: true,
    },
    orderBy: {
      submitted_at: "asc",
    },
  });

  const monthMap = new Map<string, number>();

  documents.forEach((doc) => {
    const date = new Date(doc.submitted_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
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

  const submissions: MonthlySubmission[] = Array.from(monthMap.entries())
    .map(([key, count]) => {
      const [year, month] = key.split("-");
      return {
        month: monthNames[parseInt(month) - 1],
        count,
        year: parseInt(year),
      };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
    });

  // Get last 6 months
  return submissions.slice(-6);
}


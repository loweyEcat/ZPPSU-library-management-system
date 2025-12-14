"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-library";

export interface AdminDashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalStaff: number;
  totalAdmins: number;
  totalDocuments: number;
  publishedDocuments: number;
  pendingDocuments: number;
  approvedDocuments: number;
  rejectedDocuments: number;
  totalFileSize: number;
  totalReadingSessions: number;
  totalReadingMinutes: number;
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

export interface MonthlySubmission {
  month: string;
  count: number;
  year: number;
}

export interface CollegeDistribution {
  college: string;
  count: number;
  percentage: number;
}

export interface ReadingActivity {
  month: string;
  sessions: number;
  minutes: number;
  year: number;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  await requireSuperAdmin();

  // Get user counts
  const [totalUsers, students, staff, admins] = await Promise.all([
    prisma.lib_users.count(),
    prisma.lib_users.count({ where: { user_role: "Student" } }),
    prisma.lib_users.count({ where: { user_role: "Staff" } }),
    prisma.lib_users.count({
      where: { user_role: { in: ["Admin", "Super_Admin"] } },
    }),
  ]);

  // Get document counts
  const [
    totalDocuments,
    publishedDocuments,
    pendingDocuments,
    approvedDocuments,
    rejectedDocuments,
    documents,
  ] = await Promise.all([
    prisma.lib_thesis_documents.count(),
    prisma.lib_thesis_documents.count({
      where: { submission_status: "Published" },
    }),
    prisma.lib_thesis_documents.count({
      where: {
        OR: [
          { submission_status: "Under_Review" },
          { status: { in: ["Pending", "Under_Review"] } },
        ],
      },
    }),
    prisma.lib_thesis_documents.count({
      where: {
        submission_status: { in: ["Staff_Approved", "Super_Admin_Approved"] },
      },
    }),
    prisma.lib_thesis_documents.count({
      where: {
        submission_status: {
          in: ["Staff_Rejected", "Super_Admin_Rejected"],
        },
      },
    }),
    prisma.lib_thesis_documents.findMany({
      select: { file_size: true },
    }),
  ]);

  // Calculate total file size
  const totalFileSize = documents.reduce(
    (sum, doc) => sum + (doc.file_size || 0),
    0
  );

  // Get reading session statistics
  const [totalReadingSessions, readingSessions] = await Promise.all([
    prisma.lib_document_reading_sessions.count(),
    prisma.lib_document_reading_sessions.findMany({
      select: { duration_minutes: true },
    }),
  ]);

  const totalReadingMinutes = readingSessions.reduce(
    (sum, session) => sum + (session.duration_minutes || 0),
    0
  );

  return {
    totalUsers,
    totalStudents: students,
    totalStaff: staff,
    totalAdmins: admins,
    totalDocuments,
    publishedDocuments,
    pendingDocuments,
    approvedDocuments,
    rejectedDocuments,
    totalFileSize,
    totalReadingSessions,
    totalReadingMinutes,
  };
}

export async function getDocumentTypeDistribution(): Promise<
  DocumentTypeDistribution[]
> {
  await requireSuperAdmin();

  const documents = await prisma.lib_thesis_documents.findMany({
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
  await requireSuperAdmin();

  const documents = await prisma.lib_thesis_documents.findMany({
    select: { submission_status: true, status: true },
  });

  const statusMap = new Map<string, number>();
  documents.forEach((doc) => {
    // Use submission_status as primary, fallback to status
    const status =
      doc.submission_status ||
      doc.status ||
      "Unknown";
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

export async function getMonthlySubmissions(): Promise<MonthlySubmission[]> {
  await requireSuperAdmin();

  const documents = await prisma.lib_thesis_documents.findMany({
    select: { submitted_at: true },
    orderBy: { submitted_at: "asc" },
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

  // Get last 12 months
  return submissions.slice(-12);
}

export async function getCollegeDistribution(): Promise<
  CollegeDistribution[]
> {
  await requireSuperAdmin();

  const students = await prisma.lib_users.findMany({
    where: { user_role: "Student" },
    select: { assigned_role: true },
  });

  const collegeMap = new Map<string, number>();

  students.forEach((student) => {
    if (student.assigned_role) {
      try {
        const additionalInfo = JSON.parse(student.assigned_role);
        const college = additionalInfo.college || additionalInfo.department || "Unknown";
        collegeMap.set(college, (collegeMap.get(college) || 0) + 1);
      } catch {
        collegeMap.set("Unknown", (collegeMap.get("Unknown") || 0) + 1);
      }
    } else {
      collegeMap.set("Unknown", (collegeMap.get("Unknown") || 0) + 1);
    }
  });

  const total = students.length;
  const distribution: CollegeDistribution[] = Array.from(
    collegeMap.entries()
  ).map(([college, count]) => ({
    college,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0,
  }));

  return distribution.sort((a, b) => b.count - a.count);
}

export async function getReadingActivity(): Promise<ReadingActivity[]> {
  await requireSuperAdmin();

  const sessions = await prisma.lib_document_reading_sessions.findMany({
    select: {
      started_at: true,
      duration_minutes: true,
    },
    orderBy: { started_at: "asc" },
  });

  const monthMap = new Map<
    string,
    { sessions: number; minutes: number }
  >();

  sessions.forEach((session) => {
    const date = new Date(session.started_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthMap.get(monthKey) || { sessions: 0, minutes: 0 };
    monthMap.set(monthKey, {
      sessions: existing.sessions + 1,
      minutes: existing.minutes + (session.duration_minutes || 0),
    });
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

  const activity: ReadingActivity[] = Array.from(monthMap.entries())
    .map(([key, data]) => {
      const [year, month] = key.split("-");
      return {
        month: monthNames[parseInt(month) - 1],
        sessions: data.sessions,
        minutes: data.minutes,
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


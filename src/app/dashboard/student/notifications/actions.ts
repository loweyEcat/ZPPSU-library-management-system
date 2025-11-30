"use server";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-library";

export interface Notification {
  id: string;
  type: "thesis" | "book";
  title: string;
  message: string;
  status: string;
  createdAt: string;
  read: boolean;
  link?: string;
  relatedId?: number;
  staffReviewNotes?: string;
  adminReviewNotes?: string;
}

export async function getStudentNotifications() {
  const session = await requireStudent();

  const notifications: Notification[] = [];

  // Get thesis document notifications
  const thesisDocuments = await prisma.lib_thesis_documents.findMany({
    where: {
      student_id: session.user.id,
    },
    select: {
      id: true,
      title: true,
      status: true,
      submission_status: true,
      staff_reviewed_at: true,
      admin_reviewed_at: true,
      approved_at: true,
      published_at: true,
      rejection_reason: true,
      staff_review_notes: true,
      admin_review_notes: true,
      submitted_at: true,
      date_updated: true,
    },
    orderBy: {
      date_updated: "desc",
    },
  });

  // Generate notifications from thesis documents
  // Show notifications for documents that have been reviewed or published
  for (const doc of thesisDocuments) {
    // Staff review notifications
    if (doc.staff_reviewed_at) {
      if (doc.submission_status === "Staff_Approved") {
        notifications.push({
          id: `thesis-${doc.id}-staff-approved`,
          type: "thesis",
          title: "Thesis Document Verified",
          message: `Your thesis "${doc.title}" has been verified by staff and forwarded for admin review.`,
          status: "Staff_Approved",
          createdAt: doc.staff_reviewed_at.toISOString(),
          read: false,
          link: `/dashboard/student/upload-documents`,
          relatedId: doc.id,
          staffReviewNotes: doc.staff_review_notes || undefined,
        });
      } else if (doc.submission_status === "Staff_Rejected") {
        notifications.push({
          id: `thesis-${doc.id}-staff-rejected`,
          type: "thesis",
          title: "Thesis Document Rejected",
          message: `Your thesis "${doc.title}" has been rejected by staff. ${doc.rejection_reason ? `Reason: ${doc.rejection_reason.substring(0, 100)}${doc.rejection_reason.length > 100 ? "..." : ""}` : ""}`,
          status: "Staff_Rejected",
          createdAt: doc.staff_reviewed_at.toISOString(),
          read: false,
          link: `/dashboard/student/upload-documents`,
          relatedId: doc.id,
          staffReviewNotes: doc.staff_review_notes || undefined,
        });
      } else if (doc.submission_status === "Revision_Requested") {
        notifications.push({
          id: `thesis-${doc.id}-revision-requested`,
          type: "thesis",
          title: "Revision Required",
          message: `Your thesis "${doc.title}" requires revision.`,
          status: "Revision_Requested",
          createdAt: doc.staff_reviewed_at.toISOString(),
          read: false,
          link: `/dashboard/student/upload-documents`,
          relatedId: doc.id,
          staffReviewNotes: doc.staff_review_notes || undefined,
        });
      }
    }

    // Admin review notifications (only if not already staff reviewed, or if admin reviewed after staff)
    if (doc.admin_reviewed_at) {
      if (doc.submission_status === "Super_Admin_Approved") {
        notifications.push({
          id: `thesis-${doc.id}-admin-approved`,
          type: "thesis",
          title: "Thesis Document Approved",
          message: `Your thesis "${doc.title}" has been approved by admin.`,
          status: "Super_Admin_Approved",
          createdAt: doc.admin_reviewed_at.toISOString(),
          read: false,
          link: `/dashboard/student/upload-documents`,
          relatedId: doc.id,
          adminReviewNotes: doc.admin_review_notes || undefined,
        });
      } else if (doc.submission_status === "Super_Admin_Rejected") {
        notifications.push({
          id: `thesis-${doc.id}-admin-rejected`,
          type: "thesis",
          title: "Thesis Document Rejected",
          message: `Your thesis "${doc.title}" has been rejected by admin. ${doc.rejection_reason ? `Reason: ${doc.rejection_reason.substring(0, 100)}${doc.rejection_reason.length > 100 ? "..." : ""}` : ""}`,
          status: "Super_Admin_Rejected",
          createdAt: doc.admin_reviewed_at.toISOString(),
          read: false,
          link: `/dashboard/student/upload-documents`,
          relatedId: doc.id,
          adminReviewNotes: doc.admin_review_notes || undefined,
        });
      }
    }

    // Published notification
    if (doc.published_at) {
      notifications.push({
        id: `thesis-${doc.id}-published`,
        type: "thesis",
        title: "Thesis Document Published",
        message: `Your thesis "${doc.title}" has been published and is now available in the archive.`,
        status: "Published",
        createdAt: doc.published_at.toISOString(),
        read: false,
        link: `/dashboard/student/thesis-archive`,
        relatedId: doc.id,
      });
    }
  }

  // TODO: Add book request notifications when book system is implemented
  // For now, we'll just return thesis notifications

  // Sort by creation date (newest first)
  notifications.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return notifications;
}

export async function getUnreadNotificationCount() {
  const notifications = await getStudentNotifications();
  return notifications.filter((n) => !n.read).length;
}


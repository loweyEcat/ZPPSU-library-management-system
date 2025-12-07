"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-library";
import { revalidatePath } from "next/cache";

export interface DownloadPermissionRequest {
  id: number;
  document_id: number;
  student_id: number;
  status: "Pending" | "Approved" | "Rejected";
  reason: string | null;
  requested_at: string;
  reviewed_by_id: number | null;
  reviewed_at: string | null;
  document: {
    id: number;
    title: string;
    file_name: string;
    document_type: string | null;
  };
  student: {
    id: number;
    full_name: string;
    email: string;
    student_id: string | null;
  };
  reviewed_by: {
    id: number;
    full_name: string;
  } | null;
}

export async function getDownloadPermissionRequests() {
  await requireSuperAdmin();

  try {
    const requests = await prisma.$queryRawUnsafe<
      Array<{
        id: number;
        document_id: number;
        student_id: number;
        status: string;
        reason: string | null;
        requested_at: Date;
        reviewed_by_id: number | null;
        reviewed_at: Date | null;
        document_title: string;
        document_file_name: string;
        document_type: string | null;
        student_full_name: string;
        student_email: string;
        student_student_id: string | null;
        reviewer_full_name: string | null;
      }>
    >(
      `SELECT 
        dp.id,
        dp.document_id,
        dp.student_id,
        dp.status,
        dp.reason,
        dp.requested_at,
        dp.reviewed_by_id,
        dp.reviewed_at,
        d.title as document_title,
        d.file_name as document_file_name,
        d.document_type,
        s.full_name as student_full_name,
        s.email as student_email,
        s.student_id as student_student_id,
        r.full_name as reviewer_full_name
      FROM lib_document_download_permissions dp
      INNER JOIN lib_thesis_documents d ON dp.document_id = d.id
      INNER JOIN lib_users s ON dp.student_id = s.id
      LEFT JOIN lib_users r ON dp.reviewed_by_id = r.id
      ORDER BY dp.requested_at DESC`
    );

    return requests.map((req) => ({
      id: req.id,
      document_id: req.document_id,
      student_id: req.student_id,
      status: req.status as "Pending" | "Approved" | "Rejected",
      reason: req.reason,
      requested_at: req.requested_at.toISOString(),
      reviewed_by_id: req.reviewed_by_id,
      reviewed_at: req.reviewed_at?.toISOString() || null,
      document: {
        id: req.document_id,
        title: req.document_title,
        file_name: req.document_file_name,
        document_type: req.document_type,
      },
      student: {
        id: req.student_id,
        full_name: req.student_full_name,
        email: req.student_email,
        student_id: req.student_student_id,
      },
      reviewed_by: req.reviewer_full_name
        ? {
            id: req.reviewed_by_id!,
            full_name: req.reviewer_full_name,
          }
        : null,
    }));
  } catch (error) {
    console.error("Error fetching download permission requests:", error);
    return [];
  }
}

export async function updateDownloadPermission(
  requestId: number,
  status: "Approved" | "Rejected"
) {
  const session = await requireSuperAdmin();

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE lib_document_download_permissions 
       SET status = ?, reviewed_by_id = ?, reviewed_at = NOW()
       WHERE id = ?`,
      status,
      session.user.id,
      requestId
    );

    revalidatePath("/admin/documents");
    return {
      success: true,
      message: `Download permission ${status.toLowerCase()} successfully.`,
    };
  } catch (error) {
    console.error("Error updating download permission:", error);
    return {
      success: false,
      error: "Failed to update download permission. Please try again.",
    };
  }
}


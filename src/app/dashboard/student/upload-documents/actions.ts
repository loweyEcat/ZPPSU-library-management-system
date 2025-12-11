"use server";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-library";

export async function getStudentThesisDocuments() {
  const session = await requireStudent();

  const documents = await prisma.lib_thesis_documents.findMany({
    where: {
      student_id: session.user.id,
    },
    select: {
      id: true,
      title: true,
      researcher_name: true,
      academic_year: true,
      semester: true,
      file_url: true,
      file_name: true,
      file_size: true,
      file_type: true,
      status: true,
      submission_status: true,
      submitted_at: true,
      staff_reviewed_at: true,
      admin_reviewed_at: true,
      approved_at: true,
      published_at: true,
      date_updated: true,
      document_type: true,
      reviewed_by_staff_id: true,
      reviewed_by_admin_id: true,
      assigned_staff_id: true,
      staff_review_notes: true,
      admin_review_notes: true,
      rejection_reason: true,
      lib_users_lib_thesis_documents_reviewed_by_staff_idTolib_users: {
        select: {
          id: true,
          full_name: true,
        },
      },
      lib_users_lib_thesis_documents_reviewed_by_admin_idTolib_users: {
        select: {
          id: true,
          full_name: true,
        },
      },
      lib_users_lib_thesis_documents_assigned_staff_idTolib_users: {
        select: {
          id: true,
          full_name: true,
        },
      },
    },
    orderBy: {
      submitted_at: "desc",
    },
  });

  // Serialize dates to strings for client components
  return documents.map((doc) => {
    const { 
      lib_users_lib_thesis_documents_reviewed_by_staff_idTolib_users, 
      lib_users_lib_thesis_documents_reviewed_by_admin_idTolib_users,
      lib_users_lib_thesis_documents_assigned_staff_idTolib_users,
      ...rest 
    } = doc;
    return {
      ...rest,
      assigned_staff_name: lib_users_lib_thesis_documents_assigned_staff_idTolib_users?.full_name || null,
      remarks: doc.admin_review_notes || doc.staff_review_notes || doc.rejection_reason || null,
      submitted_at: doc.submitted_at.toISOString(),
      staff_reviewed_at: doc.staff_reviewed_at?.toISOString() || null,
      admin_reviewed_at: doc.admin_reviewed_at?.toISOString() || null,
      approved_at: doc.approved_at?.toISOString() || null,
      published_at: doc.published_at?.toISOString() || null,
      date_updated: doc.date_updated.toISOString(),
    };
  });
}


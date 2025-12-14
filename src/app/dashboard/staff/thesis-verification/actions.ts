"use server";

import { prisma } from "@/lib/prisma";
import { requireStaffOrAbove } from "@/lib/auth-library";

export async function getThesisDocumentsForReview() {
  const session = await requireStaffOrAbove();

  // Get only thesis documents assigned to this staff member
  const documents = await prisma.lib_thesis_documents.findMany({
    where: {
      assigned_staff_id: session.user.id,
      OR: [
        { submission_status: "Under_Review" },
        { submission_status: "Revision_Requested" },
        { submission_status: "Super_Admin_Approved" }, // Keep reviewed documents visible
        { status: "Pending" },
        { status: "Under_Review" },
        { status: "Approved" }, // Keep approved documents visible
      ],
    },
    select: {
      id: true,
      title: true,
      researcher_name: true,
      academic_year: true,
      semester: true,
      department: true,
      year_level: true,
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
      assigned_staff_id: true,
      document_type: true,
      admin_review_notes: true,
      staff_review_notes: true,
      rejection_reason: true,
      lib_users_lib_thesis_documents_student_idTolib_users: {
        select: {
          id: true,
          full_name: true,
          email: true,
          student_id: true,
          assigned_role: true,
        },
      },
    },
    orderBy: {
      submitted_at: "desc",
    },
  });

  // Serialize dates to strings for client components and map relation
  return documents.map((doc) => {
    const { lib_users_lib_thesis_documents_student_idTolib_users, ...rest } =
      doc;
    
    // Parse assigned_role to get college/department
    let college: string | null = null;
    if (lib_users_lib_thesis_documents_student_idTolib_users?.assigned_role) {
      try {
        const additionalInfo = JSON.parse(
          lib_users_lib_thesis_documents_student_idTolib_users.assigned_role
        );
        college = additionalInfo.college || additionalInfo.department || null;
      } catch {
        // If parsing fails, leave as null
      }
    }
    
    return {
      ...rest,
      student: {
        ...lib_users_lib_thesis_documents_student_idTolib_users,
        college,
      },
      submitted_at: doc.submitted_at.toISOString(),
      staff_reviewed_at: doc.staff_reviewed_at?.toISOString() || null,
      admin_reviewed_at: doc.admin_reviewed_at?.toISOString() || null,
      approved_at: doc.approved_at?.toISOString() || null,
    };
  });
}

export async function getThesisDocumentById(documentId: number) {
  const session = await requireStaffOrAbove();

  // Get a single thesis document by ID (must be assigned to this staff member)
  const document = await prisma.lib_thesis_documents.findFirst({
    where: {
      id: documentId,
      assigned_staff_id: session.user.id,
    },
    select: {
      id: true,
      title: true,
      researcher_name: true,
      academic_year: true,
      semester: true,
      department: true,
      year_level: true,
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
      document_type: true,
      abstract: true,
      keywords: true,
      journal_name: true,
      journal_volume: true,
      journal_issue: true,
      doi: true,
      co_authors: true,
      adviser_name: true,
      project_type: true,
      capstone_category: true,
      program: true,
      lib_users_lib_thesis_documents_student_idTolib_users: {
        select: {
          id: true,
          full_name: true,
          email: true,
          student_id: true,
        },
      },
    },
  });

  if (!document) {
    return null;
  }

  // Serialize dates to strings for client components
  const { lib_users_lib_thesis_documents_student_idTolib_users, ...rest } =
    document;
  return {
    ...rest,
    student: lib_users_lib_thesis_documents_student_idTolib_users,
    submitted_at: document.submitted_at.toISOString(),
    staff_reviewed_at: document.staff_reviewed_at?.toISOString() || null,
    admin_reviewed_at: document.admin_reviewed_at?.toISOString() || null,
    approved_at: document.approved_at?.toISOString() || null,
  };
}
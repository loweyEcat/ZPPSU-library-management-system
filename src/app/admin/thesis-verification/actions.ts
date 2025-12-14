"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminOrSuperAdmin } from "@/lib/auth-library";

export async function getAllThesisDocuments() {
  const session = await requireAdminOrSuperAdmin();

  // Get all thesis documents for admin review
  // Only include documents uploaded by students (exclude admin-uploaded ebooks and journals)
  const documents = await prisma.lib_thesis_documents.findMany({
    where: {
      lib_users_lib_thesis_documents_student_idTolib_users: {
        user_role: "Student", // Only show documents uploaded by students
      },
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
      published_at: true,
      assigned_staff_id: true,
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
      staff_review_notes: true,
      admin_review_notes: true,
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
      lib_users_lib_thesis_documents_reviewed_by_staff_idTolib_users: {
        select: {
          id: true,
          full_name: true,
        },
      },
      lib_users_lib_thesis_documents_assigned_staff_idTolib_users: {
        select: {
          id: true,
          full_name: true,
          email: true,
        },
      },
    },
    orderBy: {
      submitted_at: "desc",
    },
  });

  // Serialize dates to strings for client components and map relations
  return documents.map((doc) => {
    const {
      lib_users_lib_thesis_documents_student_idTolib_users,
      lib_users_lib_thesis_documents_reviewed_by_staff_idTolib_users,
      lib_users_lib_thesis_documents_assigned_staff_idTolib_users,
      ...rest
    } = doc;
    
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
      reviewed_by_staff:
        lib_users_lib_thesis_documents_reviewed_by_staff_idTolib_users,
      assigned_staff:
        lib_users_lib_thesis_documents_assigned_staff_idTolib_users,
      submitted_at: doc.submitted_at.toISOString(),
      staff_reviewed_at: doc.staff_reviewed_at?.toISOString() || null,
      admin_reviewed_at: doc.admin_reviewed_at?.toISOString() || null,
      approved_at: doc.approved_at?.toISOString() || null,
      published_at: doc.published_at?.toISOString() || null,
    };
  });
}

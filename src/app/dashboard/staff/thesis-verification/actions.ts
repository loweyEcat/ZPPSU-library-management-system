"use server";

import { prisma } from "@/lib/prisma";
import { requireStaffOrAbove } from "@/lib/auth-library";

export async function getThesisDocumentsForReview() {
  const session = await requireStaffOrAbove();

  // Get all thesis documents that need staff review or are pending
  const documents = await prisma.lib_thesis_documents.findMany({
    where: {
      OR: [
        { submission_status: "Under_Review" },
        { submission_status: "Revision_Requested" },
        { status: "Pending" },
        { status: "Under_Review" },
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
      lib_users_lib_thesis_documents_student_idTolib_users: {
        select: {
          id: true,
          full_name: true,
          email: true,
          student_id: true,
        },
      },
    },
    orderBy: {
      submitted_at: "desc",
    },
  });

  // Serialize dates to strings for client components and map relation
  return documents.map((doc) => {
    const { lib_users_lib_thesis_documents_student_idTolib_users, ...rest } = doc;
    return {
      ...rest,
      student: lib_users_lib_thesis_documents_student_idTolib_users,
      submitted_at: doc.submitted_at.toISOString(),
      staff_reviewed_at: doc.staff_reviewed_at?.toISOString() || null,
      admin_reviewed_at: doc.admin_reviewed_at?.toISOString() || null,
      approved_at: doc.approved_at?.toISOString() || null,
    };
  });
}


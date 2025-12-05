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
      date_updated: true,
      document_type: true,
    },
    orderBy: {
      submitted_at: "desc",
    },
  });

  // Serialize dates to strings for client components
  return documents.map((doc) => ({
    ...doc,
    submitted_at: doc.submitted_at.toISOString(),
    staff_reviewed_at: doc.staff_reviewed_at?.toISOString() || null,
    admin_reviewed_at: doc.admin_reviewed_at?.toISOString() || null,
    approved_at: doc.approved_at?.toISOString() || null,
    date_updated: doc.date_updated.toISOString(),
  }));
}


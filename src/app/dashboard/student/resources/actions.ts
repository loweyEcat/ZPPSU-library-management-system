"use server";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-library";

export async function getPublishedDocumentsForStudent() {
  const session = await requireStudent();

  // Get all published documents (Journals, Thesis, Capstone)
  const documents = await prisma.lib_thesis_documents.findMany({
    where: {
      submission_status: "Published",
      published_at: {
        not: null,
      },
      document_type: {
        in: ["Thesis", "Journal", "Capstone"],
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
      approved_at: true,
      published_at: true,
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
      is_restricted: true,
      time_limit_minutes: true,
      max_attempts: true,
      student_id: true,
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
      published_at: "desc",
    },
  });

  // Get cooldown information for all documents
  const cooldowns = await prisma.lib_document_access_cooldowns.findMany({
    where: {
      user_id: session.user.id,
      document_id: { in: documents.map((d) => d.id) },
    },
  });

  // Count attempts for all documents (only completed reading sessions)
  const attemptCounts = await Promise.all(
    documents.map(async (doc) => {
      if (!doc.max_attempts) return { documentId: doc.id, count: 0 };
      const count = await prisma.lib_document_reading_sessions.count({
        where: {
          document_id: doc.id,
          user_id: session.user.id,
          ended_at: { not: null }, // Only count completed sessions
        },
      });
      return { documentId: doc.id, count };
    })
  );

  // Serialize dates to strings for client components
  return documents.map((doc) => {
    const { lib_users_lib_thesis_documents_student_idTolib_users, ...rest } =
      doc;
    const cooldown = cooldowns.find((c) => c.document_id === doc.id);
    const attemptCount =
      attemptCounts.find((a) => a.documentId === doc.id)?.count || 0;
    const isInCooldown = cooldown && cooldown.cooldown_until > new Date();
    const hasReachedMaxAttempts =
      doc.max_attempts && attemptCount >= doc.max_attempts;

    return {
      ...rest,
      student: lib_users_lib_thesis_documents_student_idTolib_users,
      submitted_at: doc.submitted_at.toISOString(),
      approved_at: doc.approved_at?.toISOString() || null,
      published_at: doc.published_at?.toISOString() || null,
      // Check if current student can access this document
      canAccess: !doc.is_restricted || doc.student_id === session.user.id,
      // Cooldown and attempt information
      cooldownUntil: cooldown?.cooldown_until.toISOString() || null,
      isInCooldown: isInCooldown || false,
      attemptCount,
      hasReachedMaxAttempts: hasReachedMaxAttempts || false,
    };
  });
}

export async function getPublishedDocumentByIdForStudent(documentId: number) {
  const session = await requireStudent();

  // Get a single published document by ID
  const document = await prisma.lib_thesis_documents.findFirst({
    where: {
      id: documentId,
      submission_status: "Published",
      published_at: {
        not: null,
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
      approved_at: true,
      published_at: true,
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
      is_restricted: true,
      time_limit_minutes: true,
      max_attempts: true,
      student_id: true,
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

  // Check access - if restricted, only allow the document owner (student)
  if (document.is_restricted && document.student_id !== session.user.id) {
    return null; // Access denied
  }

  // Serialize dates to strings for client components
  const { lib_users_lib_thesis_documents_student_idTolib_users, ...rest } =
    document;
  return {
    ...rest,
    student: lib_users_lib_thesis_documents_student_idTolib_users,
    submitted_at: document.submitted_at.toISOString(),
    approved_at: document.approved_at?.toISOString() || null,
    published_at: document.published_at?.toISOString() || null,
  };
}

export async function getStudentAttemptCount(documentId: number) {
  const session = await requireStudent();

  // Count completed reading sessions for this student and document
  const attemptCount = await prisma.lib_document_reading_sessions.count({
    where: {
      document_id: documentId,
      user_id: session.user.id,
      ended_at: { not: null }, // Only count completed sessions
    },
  });

  // Get document max_attempts
  const document = await prisma.lib_thesis_documents.findUnique({
    where: { id: documentId },
    select: {
      max_attempts: true,
    },
  });

  return {
    attemptCount,
    maxAttempts: document?.max_attempts || null,
  };
}

export async function checkDocumentAccessForStudent(documentId: number) {
  const session = await requireStudent();

  // Get document info
  const document = await prisma.lib_thesis_documents.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      max_attempts: true,
      is_restricted: true,
      student_id: true,
    },
  });

  if (!document) {
    return { error: "Document not found" };
  }

  // Check if restricted
  if (document.is_restricted && document.student_id !== session.user.id) {
    return { error: "Access denied. This document is restricted." };
  }

  // Check cooldown - ONLY for this specific student
  if (document.max_attempts) {
    const cooldown = await prisma.lib_document_access_cooldowns.findUnique({
      where: {
        document_id_user_id: {
          document_id: documentId,
          user_id: session.user.id,
        },
      },
    });

    if (cooldown && cooldown.cooldown_until > new Date()) {
      const hoursRemaining = Math.ceil(
        (cooldown.cooldown_until.getTime() - Date.now()) / (1000 * 60 * 60)
      );
      return {
        error: `You have reached the maximum attempts. Please wait ${hoursRemaining} hour(s) before trying again.`,
        isInCooldown: true,
        hoursRemaining,
      };
    }

    // Count current attempts (completed reading sessions) - ONLY for this specific student
    // Attempts are counted when students actually preview and end the session
    const attemptCount = await prisma.lib_document_reading_sessions.count({
      where: {
        document_id: documentId,
        user_id: session.user.id,
        ended_at: { not: null }, // Only count completed sessions
      },
    });

    // Check if this preview would exceed max attempts
    // Example: If max_attempts = 2, they can preview twice (attemptCount 0, 1)
    // On 3rd preview attempt (attemptCount = 2), they're restricted
    if (attemptCount >= document.max_attempts) {
      const cooldownUntil = new Date();
      cooldownUntil.setHours(cooldownUntil.getHours() + 24);

      await prisma.lib_document_access_cooldowns.upsert({
        where: {
          document_id_user_id: {
            document_id: documentId,
            user_id: session.user.id,
          },
        },
        create: {
          document_id: documentId,
          user_id: session.user.id,
          cooldown_until: cooldownUntil,
        },
        update: {
          cooldown_until: cooldownUntil,
        },
      });

      return {
        error: `You have reached the maximum attempts (${document.max_attempts}). Please wait 24 hours before trying again.`,
        isInCooldown: true,
        hoursRemaining: 24,
      };
    }
  }

  return { success: true, canAccess: true };
}

export async function checkDownloadPermission(documentId: number) {
  const session = await requireStudent();

  try {
    // Check if there's an approved permission for this student and document
    const result = await prisma.$queryRawUnsafe<
      Array<{
        id: number;
        document_id: number;
        student_id: number;
        status: string;
      }>
    >(
      `SELECT id, document_id, student_id, status 
       FROM lib_document_download_permissions 
       WHERE document_id = ? AND student_id = ? AND status = 'Approved' 
       LIMIT 1`,
      documentId,
      session.user.id
    );

    const approvedPermission = result[0] || null;

    return {
      hasPermission: !!approvedPermission,
      permission: approvedPermission,
    };
  } catch (error) {
    console.error("Error checking download permission:", error);
    return {
      hasPermission: false,
      permission: null,
    };
  }
}

export async function requestDownloadPermission(
  documentId: number,
  reason: string | null
) {
  const session = await requireStudent();

  try {
    // Check if document exists
    const document = await prisma.lib_thesis_documents.findUnique({
      where: { id: documentId },
      select: { id: true },
    });

    if (!document) {
      return {
        success: false,
        error: "Document not found",
      };
    }

    // Check if there's already a pending request for this student and document
    const existingRequests = await prisma.$queryRawUnsafe<
      Array<{ id: number }>
    >(
      `SELECT id FROM lib_document_download_permissions 
       WHERE document_id = ? AND student_id = ? AND status = 'Pending' 
       LIMIT 1`,
      documentId,
      session.user.id
    );

    if (existingRequests.length > 0) {
      return {
        success: false,
        error:
          "You already have a pending download permission request for this document.",
      };
    }

    // Create the download permission request using raw SQL
    await prisma.$executeRawUnsafe(
      `INSERT INTO lib_document_download_permissions 
       (document_id, student_id, status, reason, requested_at) 
       VALUES (?, ?, 'Pending', ?, NOW())`,
      documentId,
      session.user.id,
      reason || null
    );

    return {
      success: true,
      message:
        "Download permission request submitted successfully. The super admin will review your request.",
    };
  } catch (error) {
    console.error("Error requesting download permission:", error);
    return {
      success: false,
      error: "Failed to submit download permission request. Please try again.",
    };
  }
}

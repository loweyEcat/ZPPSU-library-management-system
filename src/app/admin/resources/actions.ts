"use server";

import { prisma } from "@/lib/prisma";
import {
  requireAdminOrSuperAdmin,
  requireSuperAdmin,
  requireAuth,
} from "@/lib/auth-library";
import { revalidatePath } from "next/cache";

export async function getPublishedDocuments() {
  await requireAdminOrSuperAdmin();

  // Get only published documents (Journals, Thesis, Capstone)
  const documents = await prisma.lib_thesis_documents.findMany({
    where: {
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

      ebook_cover_image: true,
      is_restricted: true,
      is_hidden: true,
      time_limit_minutes: true,
      max_attempts: true,
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

  // Serialize dates to strings for client components
  return documents.map((doc: any) => {
    const { lib_users_lib_thesis_documents_student_idTolib_users, ...rest } =
      doc;
    return {
      ...rest,
      student: lib_users_lib_thesis_documents_student_idTolib_users,
      submitted_at: doc.submitted_at.toISOString(),
      approved_at: doc.approved_at?.toISOString() || null,
      published_at: doc.published_at?.toISOString() || null,
    };
  });
}

export async function getPublishedDocumentById(documentId: number) {
  await requireAdminOrSuperAdmin();

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

      ebook_cover_image: true,
      is_restricted: true,
      is_hidden: true,
      time_limit_minutes: true,
      max_attempts: true,
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
    document as any;
  return {
    ...rest,
    student: lib_users_lib_thesis_documents_student_idTolib_users,
    submitted_at: document.submitted_at.toISOString(),
    approved_at: document.approved_at?.toISOString() || null,
    published_at: document.published_at?.toISOString() || null,
  };
}

// Restriction Management Actions
export async function toggleDocumentRestriction(documentId: number) {
  const session = await requireSuperAdmin();

  const document = await prisma.lib_thesis_documents.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    return { error: "Document not found" };
  }

  const updated = await prisma.lib_thesis_documents.update({
    where: { id: documentId },
    data: {
      is_restricted: !document.is_restricted,
    },
  });

  revalidatePath("/admin/resources");
  return { success: true, is_restricted: updated.is_restricted };
}

export async function setDocumentTimeLimit(
  documentId: number,
  timeLimitMinutes: number | null
) {
  const session = await requireSuperAdmin();

  const document = await prisma.lib_thesis_documents.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    return { error: "Document not found" };
  }

  const updated = await prisma.lib_thesis_documents.update({
    where: { id: documentId },
    data: {
      time_limit_minutes: timeLimitMinutes,
    },
  });

  revalidatePath("/admin/resources");
  return { success: true, time_limit_minutes: updated.time_limit_minutes };
}

export async function setDocumentMaxAttempts(
  documentId: number,
  maxAttempts: number | null
) {
  const session = await requireSuperAdmin();

  const document = await prisma.lib_thesis_documents.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    return { error: "Document not found" };
  }

  if (maxAttempts !== null && (maxAttempts < 1 || maxAttempts > 100)) {
    return { error: "Max attempts must be between 1 and 100" };
  }

  const updated = await prisma.lib_thesis_documents.update({
    where: { id: documentId },
    data: {
      max_attempts: maxAttempts,
    },
  });

  revalidatePath("/admin/resources");
  return { success: true, max_attempts: updated.max_attempts };
}

// Reading Session Actions
export async function startReadingSession(documentId: number) {
  const session = await requireAuth();

  // Check if document is restricted and user is a student
  const document = await prisma.lib_thesis_documents.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      is_restricted: true,
      time_limit_minutes: true,
      max_attempts: true,
      student_id: true,
    },
  });

  if (!document) {
    return { error: "Document not found" };
  }

  // If restricted, only allow the document owner (student) to access
  if (document.is_restricted && session.user.userRole === "Student") {
    if (session.user.id !== document.student_id) {
      return { error: "Access denied. This document is restricted." };
    }
  }

  // Max attempts and cooldown restrictions ONLY apply to students
  // Admins, Super Admins, and Staff are never restricted by max attempts
  if (session.user.userRole === "Student" && document.max_attempts) {
    // Check if user is in cooldown
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
        error: `Access denied. You have reached the maximum attempts. Please wait ${hoursRemaining} hour(s) before trying again.`,
      };
    }

    // Count user's attempts (completed reading sessions) - ONLY for this specific student
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
        error: `Access denied. You have reached the maximum attempts (${document.max_attempts}). Please wait 24 hours before trying again.`,
      };
    }
  }

  // Check if there's an active session
  const activeSession = await prisma.lib_document_reading_sessions.findFirst({
    where: {
      document_id: documentId,
      user_id: session.user.id,
      ended_at: null,
    },
    orderBy: {
      started_at: "desc",
    },
  });

  if (activeSession) {
    return { success: true, session_id: activeSession.id };
  }

  // Create new reading session
  const readingSession = await prisma.lib_document_reading_sessions.create({
    data: {
      document_id: documentId,
      user_id: session.user.id,
      time_limit_minutes: document.time_limit_minutes,
    },
  });

  return { success: true, session_id: readingSession.id };
}

export async function endReadingSession(sessionId: number) {
  const session = await requireAuth();

  const readingSession = await prisma.lib_document_reading_sessions.findUnique({
    where: { id: sessionId },
    include: {
      document: {
        select: {
          id: true,
          max_attempts: true,
        },
      },
    },
  });

  if (!readingSession) {
    return { error: "Reading session not found" };
  }

  // Only allow the session owner to end it
  if (readingSession.user_id !== session.user.id) {
    return { error: "Unauthorized" };
  }

  if (readingSession.ended_at) {
    return { success: true, duration_minutes: readingSession.duration_minutes };
  }

  // Calculate duration
  const startTime = readingSession.started_at.getTime();
  const endTime = new Date().getTime();
  const durationMs = endTime - startTime;
  const durationMinutes = Math.floor(durationMs / 60000);

  // Check if time limit was exceeded
  const wasTimeLimitExceeded =
    readingSession.time_limit_minutes !== null &&
    durationMinutes > readingSession.time_limit_minutes;

  // End the session (this counts as an attempt)
  const updated = await prisma.lib_document_reading_sessions.update({
    where: { id: sessionId },
    data: {
      ended_at: new Date(),
      duration_minutes: durationMinutes,
      was_time_limit_exceeded: wasTimeLimitExceeded,
    },
  });

  // For students, check if ending this session reached max attempts
  // Example: If max_attempts = 2, after 2 previews (2 ended sessions), set cooldown
  if (
    session.user.userRole === "Student" &&
    readingSession.document.max_attempts
  ) {
    // Count attempts after ending this session
    const attemptCount = await prisma.lib_document_reading_sessions.count({
      where: {
        document_id: readingSession.document_id,
        user_id: session.user.id,
        ended_at: { not: null },
      },
    });

    // If max attempts reached after this preview, set cooldown for this student only
    // Example: max_attempts = 2, after 2nd preview (attemptCount = 2), set cooldown
    if (attemptCount >= readingSession.document.max_attempts) {
      const cooldownUntil = new Date();
      cooldownUntil.setHours(cooldownUntil.getHours() + 24);

      await prisma.lib_document_access_cooldowns.upsert({
        where: {
          document_id_user_id: {
            document_id: readingSession.document_id,
            user_id: session.user.id,
          },
        },
        create: {
          document_id: readingSession.document_id,
          user_id: session.user.id,
          cooldown_until: cooldownUntil,
        },
        update: {
          cooldown_until: cooldownUntil,
        },
      });
    }
  }

  return {
    success: true,
    duration_minutes: updated.duration_minutes,
    was_time_limit_exceeded: updated.was_time_limit_exceeded,
  };
}

export async function getReadingSessionStats(documentId: number) {
  await requireAdminOrSuperAdmin();

  const sessions = await prisma.lib_document_reading_sessions.findMany({
    where: { document_id: documentId },
    include: {
      user: {
        select: {
          id: true,
          full_name: true,
          email: true,
          student_id: true,
        },
      },
    },
    orderBy: {
      started_at: "desc",
    },
  });

  const totalMinutes = sessions.reduce(
    (sum, s) => sum + (s.duration_minutes || 0),
    0
  );

  return {
    total_sessions: sessions.length,
    total_minutes: totalMinutes,
    sessions: sessions.map((s) => ({
      id: s.id,
      user: s.user,
      started_at: s.started_at.toISOString(),
      ended_at: s.ended_at?.toISOString() || null,
      duration_minutes: s.duration_minutes,
      was_time_limit_exceeded: s.was_time_limit_exceeded,
    })),
  };
}

export async function checkDocumentAccess(documentId: number) {
  const session = await requireAuth();

  const document = await prisma.lib_thesis_documents.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      is_restricted: true,
      max_attempts: true,
      student_id: true,
    },
  });

  if (!document) {
    return { hasAccess: false, error: "Document not found" };
  }

  // Admins and staff always have access
  if (
    session.user.userRole === "Super_Admin" ||
    session.user.userRole === "Admin" ||
    session.user.userRole === "Staff"
  ) {
    return { hasAccess: true };
  }

  // If restricted, only allow the document owner (student)
  if (document.is_restricted && session.user.userRole === "Student") {
    if (session.user.id !== document.student_id) {
      return {
        hasAccess: false,
        error: "Access denied. This document is restricted to its owner.",
      };
    }
  }

  // Check max attempts and cooldown for students
  if (session.user.userRole === "Student" && document.max_attempts) {
    // Check if user is in cooldown
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
        hasAccess: false,
        error: `Access denied. You have reached the maximum attempts. Please wait ${hoursRemaining} hour(s) before trying again.`,
      };
    }

    // Count user's attempts (completed reading sessions)
    const attemptCount = await prisma.lib_document_reading_sessions.count({
      where: {
        document_id: documentId,
        user_id: session.user.id,
        ended_at: { not: null },
      },
    });

    // If max attempts reached, set cooldown
    if (attemptCount >= document.max_attempts) {
      const cooldownUntil = new Date();
      cooldownUntil.setHours(cooldownUntil.getHours() + 24); // 24 hours from now

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
        hasAccess: false,
        error: `Access denied. You have reached the maximum attempts (${document.max_attempts}). Please wait 24 hours before trying again.`,
      };
    }
  }

  return { hasAccess: true };
}

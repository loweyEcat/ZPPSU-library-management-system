"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminOrSuperAdmin } from "@/lib/auth-library";
import { lib_books_status } from "../../../../generated/prisma/enums";

export async function getAllBooks() {
  await requireAdminOrSuperAdmin();

  const books = await prisma.lib_books.findMany({
    select: {
      id: true,
      books_name: true,
      author_name: true,
      isbn: true,
      publisher: true,
      publication_year: true,
      edition: true,
      subject: true,
      department: true,
      books_type: true,
      books_category: true,
      description: true,
      language: true,
      classification_code: true,
      shelf_location: true,
      format: true,
      total_copies: true,
      available_copies: true,
      status: true,
      created_at: true,
      updated_at: true,
      borrow_requests: {
        where: {
          status: {
            in: [
              "Pending",
              "Approved",
              "Borrowed",
              "Returned",
              "Overdue",
              "Rejected",
              "Received",
            ],
          },
        },
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return books.map((book) => {
    // Use status directly since Prisma returns enum values
    // Default to "Available" if status is null (per schema default)
    let normalizedStatus: lib_books_status = book.status || "Available";

    return {
      id: book.id,
      books_name: book.books_name,
      author_name: book.author_name,
      isbn: book.isbn,
      publisher: book.publisher,
      publication_year: book.publication_year,
      edition: book.edition,
      subject: book.subject,
      department: book.department,
      books_type: book.books_type,
      books_category: book.books_category,
      description: book.description,
      language: book.language,
      classification_code: book.classification_code,
      shelf_location: book.shelf_location,
      format: book.format,
      total_copies: book.total_copies,
      available_copies: book.available_copies,
      status: normalizedStatus,
      created_at: book.created_at?.toISOString() || null,
      updated_at: book.updated_at?.toISOString() || null,
      total_requests: book.borrow_requests.length,
      active_requests: book.borrow_requests.filter(
        (req) =>
          req.status === "Pending" ||
          req.status === "Approved" ||
          req.status === "Borrowed"
      ).length,
    };
  });
}

export async function getAllBookRequests() {
  await requireAdminOrSuperAdmin();

  const requests = await prisma.lib_book_requests.findMany({
    where: {
      status: {
        in: [
          "Pending",
          "Approved",
          "Borrowed",
          "Returned",
          "Overdue",
          "Rejected",
          "Received",
        ],
      },
    },
    select: {
      id: true,
      student_id: true,
      staff_id: true,
      book_id: true,
      tracking_number: true,
      quantity: true,
      request_date: true,
      approved_date: true,
      borrow_date: true,
      due_date: true,
      return_date: true,
      status: true,
      created_at: true,
      updated_at: true,
      lib_book_fines: {
        select: {
          id: true,
          reason: true,
          status: true,
          description: true,
        },
        orderBy: {
          created_at: "desc",
        },
      },
      student: {
        select: {
          id: true,
          full_name: true,
          email: true,
          student_id: true,
          year_level: true,
          department: true,
        },
      },
      staff: {
        select: {
          id: true,
          full_name: true,
          email: true,
        },
      },
      book: {
        select: {
          id: true,
          books_name: true,
          author_name: true,
          isbn: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return requests.map((request) => {
    const { lib_book_fines, ...rest } = request;
    const latestFine = lib_book_fines.length > 0 ? lib_book_fines[0] : null;

    // Normalize fine_status: Prisma returns "Partially Paid" but we need "Partially_Paid"
    let normalizedFineStatus:
      | "Unpaid"
      | "Paid"
      | "Waived"
      | "Partially_Paid"
      | null = null;
    if (latestFine?.status) {
      if (latestFine.status === "Partially Paid") {
        normalizedFineStatus = "Partially_Paid";
      } else if (
        latestFine.status === "Unpaid" ||
        latestFine.status === "Paid" ||
        latestFine.status === "Waived"
      ) {
        normalizedFineStatus = latestFine.status;
      }
    }

    return {
      ...rest,
      has_fine: latestFine !== null,
      fine_reason: (latestFine?.reason as "Damaged" | "Lost" | null) || null,
      fine_status: normalizedFineStatus,
      lib_book_fines: lib_book_fines.map((fine) => ({
        id: fine.id,
        reason: fine.reason,
        status: fine.status,
        description: fine.description,
      })),
      request_date: request.request_date?.toISOString() || null,
      approved_date: request.approved_date?.toISOString() || null,
      borrow_date: request.borrow_date?.toISOString() || null,
      due_date: request.due_date?.toISOString() || null,
      return_date: request.return_date?.toISOString() || null,
      created_at: request.created_at?.toISOString() || null,
      updated_at: request.updated_at?.toISOString() || null,
    } as {
      id: number;
      student_id: number;
      staff_id: number | null;
      book_id: number;
      tracking_number: string;
      quantity: number | null;
      request_date: string | null;
      approved_date: string | null;
      borrow_date: string | null;
      due_date: string | null;
      return_date: string | null;
      status:
        | "Pending"
        | "Approved"
        | "Borrowed"
        | "Returned"
        | "Under_Review"
        | "Received"
        | "Overdue"
        | "Rejected"
        | null;
      has_fine: boolean;
      fine_reason: "Damaged" | "Lost" | null;
      fine_status: "Unpaid" | "Paid" | "Waived" | "Partially_Paid" | null;
      lib_book_fines: Array<{
        id: number;
        reason: string;
        status: string;
        description: string | null;
      }>;
      created_at: string | null;
      updated_at: string | null;
      student: {
        id: number;
        full_name: string;
        email: string;
        student_id: string | null;
        year_level: string | null;
        department: string | null;
      };
      staff: {
        id: number;
        full_name: string;
        email: string;
      } | null;
      book: {
        id: number;
        books_name: string;
        author_name: string;
        isbn: string;
      };
    };
  });
}

export async function getBookById(bookId: number) {
  await requireAdminOrSuperAdmin();

  const book = await prisma.lib_books.findUnique({
    where: { id: bookId },
    select: {
      id: true,
      books_name: true,
      author_name: true,
      isbn: true,
      publisher: true,
      publication_year: true,
      edition: true,
      subject: true,
      department: true,
      books_type: true,
      books_category: true,
      description: true,
      language: true,
      classification_code: true,
      shelf_location: true,
      format: true,
      total_copies: true,
      available_copies: true,
      status: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!book) {
    return null;
  }

  // Use status directly since Prisma returns enum values
  // Default to "Available" if status is null (per schema default)
  let normalizedStatus: lib_books_status = book.status || "Available";

  return {
    ...book,
    status: normalizedStatus,
    created_at: book.created_at?.toISOString() || null,
    updated_at: book.updated_at?.toISOString() || null,
  };
}

export async function createBook(data: {
  books_name: string;
  author_name: string;
  isbn: string;
  publisher: string | null;
  publication_year: number | null;
  edition: string | null;
  subject: string | null;
  department: string | null;
  books_type: string | null;
  books_category: string | null;
  description: string | null;
  language: string | null;
  classification_code: string | null;
  shelf_location: string | null;
  format: string | null;
  total_copies: number;
  available_copies: number;
  status: lib_books_status;
}) {
  await requireAdminOrSuperAdmin();

  try {
    // Check if ISBN already exists
    const existingBook = await prisma.lib_books.findUnique({
      where: { isbn: data.isbn },
    });

    if (existingBook) {
      return {
        success: false,
        message: "A book with this ISBN already exists.",
      };
    }

    // Validate available copies doesn't exceed total copies
    if (data.available_copies > data.total_copies) {
      return {
        success: false,
        message: "Available copies cannot exceed total copies.",
      };
    }

    const book = await prisma.lib_books.create({
      data: {
        books_name: data.books_name,
        author_name: data.author_name,
        isbn: data.isbn,
        publisher: data.publisher,
        publication_year: data.publication_year,
        edition: data.edition,
        subject: data.subject,
        department: data.department,
        books_type: data.books_type,
        books_category: data.books_category,
        description: data.description,
        language: data.language,
        classification_code: data.classification_code,
        shelf_location: data.shelf_location,
        format: data.format,
        total_copies: data.total_copies,
        available_copies: data.available_copies,
        status: data.status,
      },
    });

    return {
      success: true,
      message: "Book created successfully.",
      book,
    };
  } catch (error: any) {
    console.error("Error creating book:", error);

    if (error.code === "P2002") {
      return {
        success: false,
        message: "A book with this ISBN already exists.",
      };
    }

    return {
      success: false,
      message: "Failed to create book. Please try again.",
    };
  }
}

export async function updateBook(
  bookId: number,
  data: {
    books_name?: string;
    author_name?: string;
    isbn?: string;
    publisher?: string | null;
    publication_year?: number | null;
    edition?: string | null;
    subject?: string | null;
    department?: string | null;
    books_type?: string | null;
    books_category?: string | null;
    description?: string | null;
    language?: string | null;
    classification_code?: string | null;
    shelf_location?: string | null;
    format?: string | null;
    total_copies?: number;
    available_copies?: number;
    status?: lib_books_status;
  }
) {
  await requireAdminOrSuperAdmin();

  try {
    // Check if book exists
    const existingBook = await prisma.lib_books.findUnique({
      where: { id: bookId },
    });

    if (!existingBook) {
      return {
        success: false,
        message: "Book not found.",
      };
    }

    // If ISBN is being updated, check if it already exists for another book
    if (data.isbn && data.isbn !== existingBook.isbn) {
      const isbnExists = await prisma.lib_books.findUnique({
        where: { isbn: data.isbn },
      });

      if (isbnExists) {
        return {
          success: false,
          message: "A book with this ISBN already exists.",
        };
      }
    }

    // Validate available copies doesn't exceed total copies
    const totalCopies = data.total_copies ?? existingBook.total_copies ?? 1;
    const availableCopies =
      data.available_copies ?? existingBook.available_copies ?? totalCopies;

    if (availableCopies > totalCopies) {
      return {
        success: false,
        message: "Available copies cannot exceed total copies.",
      };
    }

    // Build update data object (only include fields that are provided)
    const updateData: any = {};
    if (data.books_name !== undefined) updateData.books_name = data.books_name;
    if (data.author_name !== undefined)
      updateData.author_name = data.author_name;
    if (data.isbn !== undefined) updateData.isbn = data.isbn;
    if (data.publisher !== undefined) updateData.publisher = data.publisher;
    if (data.publication_year !== undefined)
      updateData.publication_year = data.publication_year;
    if (data.edition !== undefined) updateData.edition = data.edition;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.books_type !== undefined) updateData.books_type = data.books_type;
    if (data.books_category !== undefined)
      updateData.books_category = data.books_category;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.classification_code !== undefined)
      updateData.classification_code = data.classification_code;
    if (data.shelf_location !== undefined)
      updateData.shelf_location = data.shelf_location;
    if (data.format !== undefined) updateData.format = data.format;
    if (data.total_copies !== undefined)
      updateData.total_copies = data.total_copies;
    if (data.available_copies !== undefined)
      updateData.available_copies = data.available_copies;
    if (data.status !== undefined) updateData.status = data.status;

    const book = await prisma.lib_books.update({
      where: { id: bookId },
      data: updateData,
    });

    return {
      success: true,
      message: "Book updated successfully.",
      book,
    };
  } catch (error: any) {
    console.error("Error updating book:", error);

    if (error.code === "P2002") {
      return {
        success: false,
        message: "A book with this ISBN already exists.",
      };
    }

    if (error.code === "P2025") {
      return {
        success: false,
        message: "Book not found.",
      };
    }

    return {
      success: false,
      message: "Failed to update book. Please try again.",
    };
  }
}

export async function deleteBook(bookId: number) {
  await requireAdminOrSuperAdmin();

  try {
    // Check if book exists
    const existingBook = await prisma.lib_books.findUnique({
      where: { id: bookId },
      include: {
        borrow_requests: {
          where: {
            status: {
              in: ["Pending", "Approved", "Borrowed"],
            },
          },
        },
      },
    });

    if (!existingBook) {
      return {
        success: false,
        message: "Book not found.",
      };
    }

    // Check if there are active borrow requests
    if (existingBook.borrow_requests.length > 0) {
      return {
        success: false,
        message:
          "Cannot delete book with active borrow requests. Please handle all pending, approved, or borrowed requests first.",
      };
    }

    // Delete the book (cascade will handle related borrow_requests)
    await prisma.lib_books.delete({
      where: { id: bookId },
    });

    return {
      success: true,
      message: "Book deleted successfully.",
    };
  } catch (error: any) {
    console.error("Error deleting book:", error);

    if (error.code === "P2025") {
      return {
        success: false,
        message: "Book not found.",
      };
    }

    return {
      success: false,
      message: "Failed to delete book. Please try again.",
    };
  }
}

export async function getStaffMembers() {
  await requireAdminOrSuperAdmin();

  const staff = await prisma.lib_users.findMany({
    where: {
      user_role: {
        in: ["Admin", "Staff"],
      },
      status: "Active",
    },
    select: {
      id: true,
      full_name: true,
      email: true,
    },
    orderBy: {
      full_name: "asc",
    },
  });

  return staff;
}

export async function approveBookRequest(
  requestId: number,
  data: {
    staff_id: number;
    due_date: string; // ISO date string
  }
) {
  await requireAdminOrSuperAdmin();

  try {
    // Check if request exists
    const request = await prisma.lib_book_requests.findUnique({
      where: { id: requestId },
      include: {
        book: true,
      },
    });

    if (!request) {
      return {
        success: false,
        message: "Request not found.",
      };
    }

    // Check if request is still pending
    if (request.status !== "Pending") {
      return {
        success: false,
        message: `Cannot approve request with status: ${request.status}. Only pending requests can be approved.`,
      };
    }

    // Check if staff exists
    const staff = await prisma.lib_users.findUnique({
      where: { id: data.staff_id },
    });

    if (!staff) {
      return {
        success: false,
        message: "Staff member not found.",
      };
    }

    // Check if staff is active
    if (staff.status !== "Active") {
      return {
        success: false,
        message: "Selected staff member is not active.",
      };
    }

    // Validate due date is in the future
    const dueDate = new Date(data.due_date);
    const now = new Date();
    if (dueDate <= now) {
      return {
        success: false,
        message: "Due date must be in the future.",
      };
    }

    // Check if there are available copies
    const availableCopies = request.book.available_copies ?? 0;
    const requestedQuantity = request.quantity ?? 1;

    if (availableCopies < requestedQuantity) {
      return {
        success: false,
        message: `Not enough copies available. Only ${availableCopies} copy/copies available, but ${requestedQuantity} requested.`,
      };
    }

    // Update the request: approve it, assign staff, set due date, and reduce available copies
    await prisma.$transaction(async (tx) => {
      // Update the request
      await tx.lib_book_requests.update({
        where: { id: requestId },
        data: {
          status: "Approved",
          staff_id: data.staff_id,
          approved_date: new Date(),
          due_date: dueDate,
        },
      });

      // Calculate new available copies after decrement
      const newAvailableCopies = availableCopies - requestedQuantity;

      // Use book status directly since Prisma returns enum values
      let bookStatus: lib_books_status = request.book.status || "Available";

      // Update book: decrease available copies and set status to "Not Available" if no copies left
      await tx.lib_books.update({
        where: { id: request.book_id },
        data: {
          available_copies: newAvailableCopies,
          status: newAvailableCopies <= 0 ? "Not Available" : bookStatus,
          updated_at: new Date(),
        },
      });
    });

    return {
      success: true,
      message: "Book request approved successfully.",
    };
  } catch (error: any) {
    console.error("Error approving book request:", error);

    if (error.code === "P2025") {
      return {
        success: false,
        message: "Request not found.",
      };
    }

    return {
      success: false,
      message: "Failed to approve request. Please try again.",
    };
  }
}

export async function getBookBorrowers(bookId: number) {
  await requireAdminOrSuperAdmin();

  try {
    const book = await prisma.lib_books.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        books_name: true,
        author_name: true,
        isbn: true,
      },
    });

    if (!book) {
      return {
        success: false,
        message: "Book not found.",
        borrowers: [],
      };
    }

    // Get all borrow requests for this book with status Approved, Borrowed, or Returned
    const requests = await prisma.lib_book_requests.findMany({
      where: {
        book_id: bookId,
        status: {
          in: ["Approved", "Borrowed", "Returned"],
        },
      },
      select: {
        id: true,
        tracking_number: true,
        quantity: true,
        request_date: true,
        approved_date: true,
        borrow_date: true,
        due_date: true,
        return_date: true,
        status: true,
        student: {
          select: {
            id: true,
            full_name: true,
            email: true,
            student_id: true,
            year_level: true,
            department: true,
          },
        },
        staff: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        request_date: "desc",
      },
    });

    return {
      success: true,
      book,
      borrowers: requests.map((request) => ({
        id: request.id,
        tracking_number: request.tracking_number,
        quantity: request.quantity,
        request_date: request.request_date?.toISOString() || null,
        approved_date: request.approved_date?.toISOString() || null,
        borrow_date: request.borrow_date?.toISOString() || null,
        due_date: request.due_date?.toISOString() || null,
        return_date: request.return_date?.toISOString() || null,
        status: request.status,
        student: request.student,
        staff: request.staff,
      })),
    };
  } catch (error: any) {
    console.error("Error fetching book borrowers:", error);
    return {
      success: false,
      message: "Failed to fetch book borrowers.",
      borrowers: [],
    };
  }
}

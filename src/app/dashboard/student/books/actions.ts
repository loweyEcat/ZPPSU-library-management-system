"use server";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-library";

export async function getAllBooksForStudent() {
  const session = await requireStudent();

  // Get PENDING requests only - these haven't been deducted from available_copies yet
  // Approved/Borrowed requests have already been deducted from available_copies in the database
  const pendingRequests = await prisma.lib_book_requests.findMany({
    where: {
      student_id: session.user.id,
      status: "Pending",
    },
    select: {
      book_id: true,
      quantity: true,
    },
  });

  // Calculate total PENDING requested quantity per book
  const bookPendingQuantities = new Map<number, number>();
  pendingRequests.forEach((req) => {
    const current = bookPendingQuantities.get(req.book_id) || 0;
    bookPendingQuantities.set(req.book_id, current + (req.quantity || 1));
  });

  // Get all active requests (Pending, Approved, Borrowed) for checking if student has active request
  const activeRequests = await prisma.lib_book_requests.findMany({
    where: {
      student_id: session.user.id,
      status: {
        in: ["Pending", "Approved", "Borrowed"],
      },
    },
    select: {
      book_id: true,
      quantity: true,
      status: true,
    },
  });

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
          student_id: session.user.id,
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

  // Filter out books that have no remaining available copies
  // available_copies in DB already accounts for Approved/Borrowed requests
  // We only need to subtract PENDING requests to get remaining copies
  const filteredBooks = books.filter((book) => {
    const availableCopies = book.available_copies ?? 0;

    // First check: Book must have available copies in the database OR status must be Available
    // This ensures books that were returned and verified (status = Available) are shown
    // even if available_copies is temporarily 0 due to timing issues
    if (availableCopies <= 0 && book.status !== "Available") {
      return false; // Remove books with no available copies and not Available status
    }

    // Second check: Subtract only PENDING requests (Approved/Borrowed already deducted from DB)
    const pendingQty = bookPendingQuantities.get(book.id) || 0;
    const remainingAvailableCopies = availableCopies - pendingQty;

    // Keep the book if:
    // 1. There are remaining available copies (> 0), OR
    // 2. Status is Available (book was returned and verified, should be available for borrowing)
    return remainingAvailableCopies > 0 || book.status === "Available";
  });

  return filteredBooks.map((book) => {
    // Normalize status: Prisma returns "Not Available" but we need "Not_Available"
    // Default to "Available" if status is null (per schema default)
    let normalizedStatus: "Available" | "Not_Available" | "Lost" | "Damaged" =
      "Available";
    if (book.status === "Not Available") {
      normalizedStatus = "Not_Available";
    } else if (
      book.status === "Available" ||
      book.status === "Lost" ||
      book.status === "Damaged"
    ) {
      normalizedStatus = book.status;
    }

    // Check if student has any pending/approved/borrowed requests for this book
    const studentRequests = book.borrow_requests.filter(
      (req) =>
        req.status === "Pending" ||
        req.status === "Approved" ||
        req.status === "Borrowed"
    );

    // Get the first active request status, or null if none
    const activeRequestStatus =
      studentRequests.length > 0
        ? (studentRequests[0].status as
            | "Pending"
            | "Approved"
            | "Borrowed"
            | "Returned"
            | "Overdue"
            | "Rejected"
            | null)
        : null;

    // Calculate remaining available copies
    // available_copies in DB already accounts for Approved/Borrowed requests
    // Only subtract PENDING requests to get remaining copies
    const pendingQty = bookPendingQuantities.get(book.id) || 0;
    const originalAvailableCopies = book.available_copies ?? 0;
    const remainingAvailableCopies = Math.max(
      0,
      originalAvailableCopies - pendingQty
    );

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
      available_copies: originalAvailableCopies, // Keep original for reference
      remaining_available_copies: remainingAvailableCopies, // Remaining after student's requests
      status: normalizedStatus,
      created_at: book.created_at?.toISOString() || null,
      updated_at: book.updated_at?.toISOString() || null,
      has_active_request: studentRequests.length > 0,
      student_request_status: activeRequestStatus,
    };
  });
}

export async function getStudentFines() {
  const session = await requireStudent();

  // Get all fines for the logged-in student
  const fines = await prisma.lib_book_fines.findMany({
    where: {
      student_id: session.user.id,
    },
    select: {
      id: true,
      student_id: true,
      book_id: true,
      request_id: true,
      fine_amount: true,
      reason: true,
      status: true,
      description: true,
      due_date: true,
      paid_date: true,
      created_at: true,
      lib_users_lib_book_fines_student_idTolib_users: {
        select: {
          id: true,
          full_name: true,
          email: true,
          student_id: true,
          year_level: true,
          department: true,
        },
      },
      lib_book_requests: {
        select: {
          id: true,
          tracking_number: true,
          return_date: true,
          status: true,
          quantity: true,
          book: {
            select: {
              id: true,
              books_name: true,
              author_name: true,
              isbn: true,
            },
          },
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  // Serialize dates to strings for client components and map relation
  return fines.map((fine) => {
    const {
      lib_users_lib_book_fines_student_idTolib_users,
      fine_amount,
      ...rest
    } = fine;

    // Convert Decimal to number for client components
    let fineAmountNumber: number;
    if (typeof fine_amount === "object" && fine_amount !== null) {
      // Prisma Decimal type - convert to number
      fineAmountNumber = parseFloat(fine_amount.toString());
    } else if (typeof fine_amount === "string") {
      fineAmountNumber = parseFloat(fine_amount);
    } else {
      fineAmountNumber = fine_amount;
    }

    return {
      ...rest,
      fine_amount: fineAmountNumber,
      student: lib_users_lib_book_fines_student_idTolib_users,
      due_date: fine.due_date.toISOString(),
      paid_date: fine.paid_date?.toISOString() || null,
      created_at: fine.created_at.toISOString(),
      lib_book_requests: {
        ...fine.lib_book_requests,
        return_date: fine.lib_book_requests.return_date?.toISOString() || null,
      },
    };
  });
}

export async function getBookByIdForStudent(bookId: number) {
  const session = await requireStudent();

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

  // Normalize status: Prisma returns "Not Available" but we need "Not_Available"
  // Default to "Available" if status is null (per schema default)
  let normalizedStatus: "Available" | "Not_Available" | "Lost" | "Damaged" =
    "Available";
  if (book.status === "Not Available") {
    normalizedStatus = "Not_Available";
  } else if (
    book.status === "Available" ||
    book.status === "Lost" ||
    book.status === "Damaged"
  ) {
    normalizedStatus = book.status;
  }

  return {
    ...book,
    status: normalizedStatus,
    created_at: book.created_at?.toISOString() || null,
    updated_at: book.updated_at?.toISOString() || null,
  };
}

export async function createBookRequest(bookId: number, quantity: number = 1) {
  const session = await requireStudent();

  try {
    // Validate quantity
    if (quantity < 1) {
      return {
        success: false,
        message: "Quantity must be at least 1.",
      };
    }

    // Check if book exists
    const book = await prisma.lib_books.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return {
        success: false,
        message: "Book not found.",
      };
    }

    // Check if book is available
    // Normalize status: Prisma returns "Not Available" (with space) but enum is "Not_Available"
    // Allow both "Available" and "Not Available" statuses for borrowing
    const normalizedBookStatus =
      book.status === "Not Available" ? "Not_Available" : book.status;

    if (
      normalizedBookStatus !== "Available" &&
      normalizedBookStatus !== "Not_Available"
    ) {
      return {
        success: false,
        message: "This book is not available for borrowing.",
      };
    }

    // Check if there are available copies
    const availableCopies = book.available_copies ?? 0;
    if (availableCopies <= 0) {
      return {
        success: false,
        message: "No copies available for this book.",
      };
    }

    // Check if requested quantity exceeds available copies
    if (quantity > availableCopies) {
      return {
        success: false,
        message: `You can only request up to ${availableCopies} copy/copies. Only ${availableCopies} available.`,
      };
    }

    // Check if student already has an active request for this book
    const existingRequest = await prisma.lib_book_requests.findFirst({
      where: {
        student_id: session.user.id,
        book_id: bookId,
        status: {
          in: ["Pending", "Approved", "Borrowed"],
        },
      },
    });

    if (existingRequest) {
      return {
        success: false,
        message: "You already have an active request for this book.",
      };
    }

    // Generate tracking number (format: BR-YYYYMMDD-HHMMSS-XXXX)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    const trackingNumber = `BR-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;

    // Create the book request
    const request = await prisma.lib_book_requests.create({
      data: {
        student_id: session.user.id,
        book_id: bookId,
        tracking_number: trackingNumber,
        quantity: quantity,
        status: "Pending",
      },
    });

    return {
      success: true,
      message: `Book request for ${quantity} copy/copies submitted successfully!`,
      request: {
        id: request.id,
        tracking_number: request.tracking_number,
      },
    };
  } catch (error: any) {
    console.error("Error creating book request:", error);

    if (error.code === "P2002") {
      return {
        success: false,
        message:
          "A request with this tracking number already exists. Please try again.",
      };
    }

    return {
      success: false,
      message: "Failed to create book request. Please try again.",
    };
  }
}

export async function getStudentBookRequests() {
  const session = await requireStudent();

  const requests = await prisma.lib_book_requests.findMany({
    where: {
      student_id: session.user.id,
      status: {
        in: [
          "Pending",
          "Approved",
          "Borrowed",
          "Returned",
          "Under_Review",
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
        },
        orderBy: {
          created_at: "desc",
        },
        take: 1, // Get the most recent fine if any
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

    // Normalize book status
    let normalizedBookStatus:
      | "Available"
      | "Not_Available"
      | "Lost"
      | "Damaged" = "Available";
    if (request.book.status === "Not Available") {
      normalizedBookStatus = "Not_Available";
    } else if (
      request.book.status === "Available" ||
      request.book.status === "Lost" ||
      request.book.status === "Damaged"
    ) {
      normalizedBookStatus = request.book.status;
    }

    return {
      ...rest,
      has_fine: latestFine !== null,
      fine_reason: latestFine?.reason || null,
      fine_status: latestFine?.status || null,
      request_date: request.request_date?.toISOString() || null,
      approved_date: request.approved_date?.toISOString() || null,
      borrow_date: request.borrow_date?.toISOString() || null,
      due_date: request.due_date?.toISOString() || null,
      return_date: request.return_date?.toISOString() || null,
      created_at: request.created_at?.toISOString() || null,
      updated_at: request.updated_at?.toISOString() || null,
      staff_receiver: request.staff?.full_name || null,
      book: {
        ...request.book,
        status: normalizedBookStatus,
      },
    };
  });
}

export async function returnBook(requestId: number) {
  const session = await requireStudent();

  try {
    // Check if request exists and belongs to the student
    const request = await prisma.lib_book_requests.findFirst({
      where: {
        id: requestId,
        student_id: session.user.id,
      },
      include: {
        book: true,
      },
    });

    if (!request) {
      return {
        success: false,
        message: "Request not found or you don't have permission to return it.",
      };
    }

    // Only allow returning if status is Approved or Borrowed
    if (request.status !== "Approved" && request.status !== "Borrowed") {
      return {
        success: false,
        message: `Cannot return book with status: ${request.status}. Only approved or borrowed books can be returned.`,
      };
    }

    // Update request status to Under_Review and set return_date
    const returnDate = new Date();
    const returnedQuantity = request.quantity || 1;

    await prisma.$transaction(async (tx) => {
      // Update the request
      await tx.lib_book_requests.update({
        where: { id: requestId },
        data: {
          status: "Under_Review",
          return_date: returnDate,
          updated_at: returnDate,
        },
      });
    });

    return {
      success: true,
      message: "Book returned successfully. Waiting for staff verification.",
    };
  } catch (error: any) {
    console.error("Error returning book:", error);

    if (error.code === "P2025") {
      return {
        success: false,
        message: "Request not found.",
      };
    }

    return {
      success: false,
      message: "Failed to return book. Please try again.",
    };
  }
}

export async function cancelBookRequest(requestId: number) {
  const session = await requireStudent();

  try {
    // Check if request exists and belongs to the student
    const request = await prisma.lib_book_requests.findFirst({
      where: {
        id: requestId,
        student_id: session.user.id,
      },
    });

    if (!request) {
      return {
        success: false,
        message: "Request not found or you don't have permission to cancel it.",
      };
    }

    // Only allow canceling if status is Pending
    if (request.status !== "Pending") {
      return {
        success: false,
        message: `Cannot cancel request with status: ${request.status}. Only pending requests can be canceled.`,
      };
    }

    // Delete the request
    await prisma.lib_book_requests.delete({
      where: { id: requestId },
    });

    return {
      success: true,
      message: "Request canceled successfully.",
    };
  } catch (error: any) {
    console.error("Error canceling book request:", error);

    if (error.code === "P2025") {
      return {
        success: false,
        message: "Request not found.",
      };
    }

    return {
      success: false,
      message: "Failed to cancel request. Please try again.",
    };
  }
}

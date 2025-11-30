"use server";

import { prisma } from "@/lib/prisma";
import { requireStaffOrAbove } from "@/lib/auth-library";

export async function getAssignedBookRequests() {
  const session = await requireStaffOrAbove();

  // First, get all request IDs that have fines (damaged/lost books)
  // These should be excluded from the Book Requests tab
  const finesWithRequestIds = await prisma.lib_book_fines.findMany({
    where: {
      created_by_staff_id: session.user.id,
    },
    select: {
      request_id: true,
    },
  });

  const requestIdsWithFines = finesWithRequestIds.map(
    (fine) => fine.request_id
  );

  // Get all book requests assigned to the logged-in staff member
  // Exclude requests that have fines (they appear in the Damaged/Lost Books tab)
  const requests = await prisma.lib_book_requests.findMany({
    where: {
      staff_id: session.user.id,
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
      ...(requestIdsWithFines.length > 0 && {
        id: {
          notIn: requestIdsWithFines,
        },
      }),
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
          description: true,
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
      request_date: "desc",
    },
  });

  // Serialize dates to strings for client components
  return requests.map((request) => {
    const { lib_book_fines, ...rest } = request;
    return {
      ...rest,
      has_fine: lib_book_fines.length > 0,
      lib_book_fines: lib_book_fines.map((fine) => ({
        id: fine.id,
        reason: fine.reason,
        description: fine.description,
      })),
      request_date: request.request_date?.toISOString() || null,
      approved_date: request.approved_date?.toISOString() || null,
      borrow_date: request.borrow_date?.toISOString() || null,
      due_date: request.due_date?.toISOString() || null,
      return_date: request.return_date?.toISOString() || null,
      created_at: request.created_at?.toISOString() || null,
      updated_at: request.updated_at?.toISOString() || null,
    };
  });
}

export async function getBooksWithFines() {
  const session = await requireStaffOrAbove();

  // Get all book requests that have fines (damaged or lost books)
  const fines = await prisma.lib_book_fines.findMany({
    where: {
      created_by_staff_id: session.user.id,
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

export async function verifyBookReturn(
  requestId: number,
  data: {
    damagedQuantity: number;
    lostQuantity: number;
    receivedQuantity: number;
    damageDescription?: string;
    fineAmount?: number;
    dueDate?: string;
  }
) {
  const session = await requireStaffOrAbove();

  try {
    // Check if request exists and is assigned to this staff
    const request = await prisma.lib_book_requests.findFirst({
      where: {
        id: requestId,
        staff_id: session.user.id,
        status: {
          in: ["Under_Review", "Returned"],
        },
      },
      include: {
        book: true,
        student: true,
      },
    });

    if (!request) {
      return {
        success: false,
        message: "Request not found or not available for verification.",
      };
    }

    const now = new Date();
    const totalQuantity = request.quantity || 1;
    const damagedQty = data.damagedQuantity || 0;
    const lostQty = data.lostQuantity || 0;
    const receivedQty = data.receivedQuantity || 0;

    // Validate quantities
    if (damagedQty + lostQty + receivedQty !== totalQuantity) {
      return {
        success: false,
        message: `Quantities don't match. Total: ${totalQuantity}, Damaged: ${damagedQty}, Lost: ${lostQty}, Received: ${receivedQty}`,
      };
    }

    await prisma.$transaction(async (tx) => {
      // Create fine records for damaged/lost books
      if (damagedQty > 0 || lostQty > 0) {
        const fineAmount = data.fineAmount || 0;
        const dueDate = data.dueDate
          ? new Date(data.dueDate)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

        // Create fine for damaged books
        if (damagedQty > 0) {
          const damagedFineAmount =
            (fineAmount / (damagedQty + lostQty)) * damagedQty;
          await tx.lib_book_fines.create({
            data: {
              student_id: request.student_id,
              book_id: request.book_id,
              request_id: requestId,
              fine_amount: damagedFineAmount,
              reason: "Damaged",
              status: "Unpaid",
              description: data.damageDescription
                ? `${data.damageDescription} (Quantity: ${damagedQty})`
                : `Damaged books (Quantity: ${damagedQty})`,
              due_date: dueDate,
              created_by_staff_id: session.user.id,
            },
          });
        }

        // Create fine for lost books
        if (lostQty > 0) {
          const lostFineAmount =
            (fineAmount / (damagedQty + lostQty)) * lostQty;
          await tx.lib_book_fines.create({
            data: {
              student_id: request.student_id,
              book_id: request.book_id,
              request_id: requestId,
              fine_amount: lostFineAmount,
              reason: "Lost",
              status: "Unpaid",
              description: data.damageDescription
                ? `${data.damageDescription} (Quantity: ${lostQty})`
                : `Lost books (Quantity: ${lostQty})`,
              due_date: dueDate,
              created_by_staff_id: session.user.id,
            },
          });
        }

        // Update book status if all books are lost or damaged
        if (receivedQty === 0) {
          if (lostQty > 0 && damagedQty === 0) {
            await tx.lib_books.update({
              where: { id: request.book_id },
              data: {
                status: "Lost",
                updated_at: now,
              },
            });
          } else if (damagedQty > 0 && lostQty === 0) {
            await tx.lib_books.update({
              where: { id: request.book_id },
              data: {
                status: "Damaged",
                updated_at: now,
              },
            });
          }
        }
      }

      // Update available copies for received books
      if (receivedQty > 0) {
        const book = await tx.lib_books.findUnique({
          where: { id: request.book_id },
          select: {
            available_copies: true,
            status: true,
          },
        });

        if (book) {
          const newAvailableCopies = (book.available_copies ?? 0) + receivedQty;

          // When books are successfully returned, set status to Available
          await tx.lib_books.update({
            where: { id: request.book_id },
            data: {
              available_copies: newAvailableCopies,
              status: receivedQty === totalQuantity ? "Available" : book.status,
              updated_at: now,
            },
          });
        }
      }

      // Update request status
      // Format: "Received(X)" where X is the number of books received
      const statusText =
        receivedQty > 0
          ? `Received(${receivedQty})`
          : lostQty > 0 && damagedQty === 0
          ? "Returned" // Will show as "Lost" via fine_reason
          : "Returned"; // Will show as "Damaged" via fine_reason

      await tx.lib_book_requests.update({
        where: { id: requestId },
        data: {
          status: receivedQty > 0 ? "Received" : "Returned",
          updated_at: now,
        },
      });
    });

    // Build success message
    let message = "";
    if (receivedQty > 0 && (damagedQty > 0 || lostQty > 0)) {
      message = `${receivedQty} book${
        receivedQty !== 1 ? "s" : ""
      } received successfully. `;
      if (damagedQty > 0) message += `${damagedQty} damaged. `;
      if (lostQty > 0) message += `${lostQty} lost. `;
      message += "Fine has been issued.";
    } else if (receivedQty > 0) {
      message = `${receivedQty} book${
        receivedQty !== 1 ? "s" : ""
      } verified and marked as received successfully.`;
    } else {
      message = "Book verified. Fine has been issued.";
    }

    return {
      success: true,
      message,
    };
  } catch (error: any) {
    console.error("Error verifying book return:", error);
    return {
      success: false,
      message: "Failed to verify book return. Please try again.",
    };
  }
}

export async function markFineAsPaid(fineId: number) {
  const session = await requireStaffOrAbove();

  try {
    // Check if fine exists and was created by this staff member
    const fine = await prisma.lib_book_fines.findFirst({
      where: {
        id: fineId,
        created_by_staff_id: session.user.id,
        status: {
          in: ["Unpaid", "Partially_Paid"] as any,
        },
      },
    });

    if (!fine) {
      return {
        success: false,
        message: "Fine not found or already paid.",
      };
    }

    const now = new Date();

    // Update fine status to Paid and set paid_date
    await prisma.lib_book_fines.update({
      where: { id: fineId },
      data: {
        status: "Paid",
        paid_date: now,
        updated_at: now,
      },
    });

    return {
      success: true,
      message: "Fine marked as paid successfully.",
    };
  } catch (error: any) {
    console.error("Error marking fine as paid:", error);

    if (error.code === "P2025") {
      return {
        success: false,
        message: "Fine not found.",
      };
    }

    return {
      success: false,
      message: "Failed to mark fine as paid. Please try again.",
    };
  }
}

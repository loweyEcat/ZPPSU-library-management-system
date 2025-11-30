"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Loader2,
  User,
  Calendar as CalendarLucide,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { approveBookRequest, getStaffMembers } from "@/app/admin/books/actions";
import { toast } from "sonner";

interface BookRequest {
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
  has_fine?: boolean;
  fine_reason?: "Damaged" | "Lost" | null;
  fine_status?: "Unpaid" | "Paid" | "Waived" | "Partially_Paid" | null;
  lib_book_fines?: Array<{
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
}

interface StaffMember {
  id: number;
  full_name: string;
  email: string;
}

interface ApproveBookRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: BookRequest | null;
  onSuccess?: () => void;
}

export function ApproveBookRequestDialog({
  open,
  onOpenChange,
  request,
  onSuccess,
}: ApproveBookRequestDialogProps) {
  const [staffMembers, setStaffMembers] = React.useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = React.useState<string>("");
  const [dueDate, setDueDate] = React.useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = React.useState(false);

  // Load staff members when dialog opens
  React.useEffect(() => {
    if (open) {
      loadStaffMembers();
      // Set default due date to 14 days from now
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 14);
      setDueDate(defaultDueDate);
      setSelectedStaffId("");
    }
  }, [open]);

  const loadStaffMembers = async () => {
    setIsLoadingStaff(true);
    try {
      const staff = await getStaffMembers();
      setStaffMembers(staff);
    } catch (error) {
      console.error("Error loading staff members:", error);
      toast.error("Failed to load staff members.");
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleApprove = async () => {
    if (!request) return;

    if (!selectedStaffId) {
      toast.error("Please select a staff member.");
      return;
    }

    if (!dueDate) {
      toast.error("Please select a due date.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await approveBookRequest(request.id, {
        staff_id: parseInt(selectedStaffId),
        due_date: dueDate.toISOString(),
      });

      if (result.success) {
        toast.success(result.message || "Request approved successfully!");
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(result.message || "Failed to approve request.");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("An error occurred while approving the request.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!request) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Approve Book Request
          </DialogTitle>
          <DialogDescription>
            Assign a staff member and set a due date for this book request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Request Information */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-sm">Request Information</h3>
            <div className="grid gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Book: </span>
                <span className="font-medium">{request.book.books_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Student: </span>
                <span className="font-medium">{request.student.full_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tracking Number: </span>
                <span className="font-mono font-medium">
                  {request.tracking_number}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Quantity: </span>
                <span className="font-medium">{request.quantity ?? 1}</span>
              </div>
            </div>
          </div>

          {/* Staff Selection */}
          <div className="space-y-2">
            <Label htmlFor="staff" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Staff Receiver <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedStaffId}
              onValueChange={setSelectedStaffId}
              disabled={isLoadingStaff || isLoading}
            >
              <SelectTrigger id="staff" className="w-full">
                <SelectValue placeholder="Select a staff member">
                  {isLoadingStaff
                    ? "Loading staff members..."
                    : "Select a staff member"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {staffMembers.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id.toString()}>
                    <div className="flex flex-col">
                      <span>{staff.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {staff.email}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select the staff member who will handle this book request.
            </p>
          </div>

          {/* Due Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="due-date" className="flex items-center gap-2">
              <CalendarLucide className="h-4 w-4" />
              Due Date <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="due-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Select a due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Select the date when the book should be returned.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isLoading || !selectedStaffId || !dueDate}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                "Approve Request"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

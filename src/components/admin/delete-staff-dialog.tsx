"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: number | null;
  staffName?: string;
  onDelete?: () => void;
}

export function DeleteStaffDialog({
  open,
  onOpenChange,
  staffId,
  staffName,
  onDelete,
}: DeleteStaffDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = React.useCallback(async () => {
    if (!staffId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/library/users/${staffId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to delete staff member.");
        setIsDeleting(false);
        return;
      }

      toast.success(data.message);
      onOpenChange(false);
      onDelete?.(); // Call the refresh callback
      router.refresh();
    } catch (error) {
      console.error("Error deleting staff member:", error);
      toast.error("An unexpected error occurred. Please try again.");
      setIsDeleting(false);
    }
  }, [staffId, router, onOpenChange, onDelete]);

  if (!staffId) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the staff member
            {staffName && (
              <>
                {" "}
                <span className="font-semibold">"{staffName}"</span>
              </>
            )}
            . All associated book requests, fines, and notifications will also be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Download, FileText, AlertCircle } from "lucide-react";
import { requestDownloadPermission } from "@/app/dashboard/student/resources/actions";
import { toast } from "sonner";

interface RequestDownloadPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: number;
  documentTitle: string;
  onSuccess?: () => void;
}

export function RequestDownloadPermissionDialog({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  onSuccess,
}: RequestDownloadPermissionDialogProps) {
  const [reason, setReason] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Reset reason when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setReason("");
    }
  }, [open]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await requestDownloadPermission(
        documentId,
        reason.trim() || null
      );

      if (result.success) {
        toast.success(
          result.message ||
            "Download permission request submitted successfully!"
        );
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(
          result.error || "Failed to submit download permission request."
        );
      }
    } catch (error) {
      console.error("Error requesting download permission:", error);
      toast.error("An error occurred while submitting the request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Download className="h-6 w-6 text-primary" />
            Request Preview Permission
          </DialogTitle>
          <DialogDescription>
            Request permission from the super admin to download this document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Document Information */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Document Information
            </h3>
            <div className="text-sm">
              <span className="text-muted-foreground">Title: </span>
              <span className="font-medium line-clamp-2">{documentTitle}</span>
            </div>
          </div>

          {/* Info Alert */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Note</p>
                <p>
                  Your request will be sent to the super admin for review. You
                  will be notified once your request is approved or rejected.
                </p>
              </div>
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for requesting download permission (optional)"
              disabled={isSubmitting}
              rows={4}
              className="resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import * as React from "react";
import { Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UploadThesisForm } from "@/components/forms/upload-thesis-form";
import { ViewThesisDialog } from "@/components/student/view-thesis-dialog";

interface ThesisDocument {
  id: number;
  title: string;
  researcher_name: string;
  abstract?: string | null;
  keywords?: string | null;
  department?: string | null;
  year_level?: string | null;
  academic_year?: string | null;
  semester?: string | null;
  file_url?: string;
  file_name?: string;
  status?: string;
  submission_status?: string;
  staff_review_notes?: string | null;
  admin_review_notes?: string | null;
  rejection_reason?: string | null;
}

interface UploadThesisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document?: ThesisDocument;
  mode?: "create" | "edit" | "view";
  onSuccess?: () => void;
}

export function UploadThesisDialog({
  open,
  onOpenChange,
  document,
  mode = "create",
  onSuccess,
}: UploadThesisDialogProps) {
  const handleSuccess = React.useCallback(() => {
    onOpenChange(false);
    if (onSuccess) {
      onSuccess();
    }
  }, [onOpenChange, onSuccess]);

  if (mode === "view" && document) {
    return (
      <ViewThesisDialog
        open={open}
        onOpenChange={onOpenChange}
        document={document}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto sm:max-h-[90vh]">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold">
            {mode === "edit" ? "Edit Document" : "Upload Document"}
          </DialogTitle>
          <DialogDescription className="text-base">
            {mode === "edit"
              ? "Update your document information. You can only edit documents with Pending, Rejected, or Revision Required status."
              : "Fill in the information below to upload your document. Select the document type (Thesis, Journal, or Capstone) and fill in the required fields. The document will be reviewed by staff and admin."}
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <UploadThesisForm
            onSuccess={handleSuccess}
            initialData={document}
            isEdit={mode === "edit"}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UploadThesisDialogTrigger({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Thesis Document
        </Button>
      </DialogTrigger>
      <UploadThesisDialog
        open={open}
        onOpenChange={setOpen}
        mode="create"
        onSuccess={() => {
          setOpen(false);
          if (onSuccess) onSuccess();
        }}
      />
    </Dialog>
  );
}


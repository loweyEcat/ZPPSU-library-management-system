"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminEditDocumentForm } from "@/components/forms/admin-edit-document-form";

interface PublishedDocument {
  id: number;
  title: string;
  researcher_name: string;
  document_type: string | null;
  abstract?: string | null;
  keywords?: string | null;
  journal_name?: string | null;
  journal_volume?: string | null;
  journal_issue?: string | null;
  doi?: string | null;
  co_authors?: string | null;
  ebook_cover_image?: string | null;
  [key: string]: any;
}

interface AdminEditDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: PublishedDocument;
  onSuccess?: () => void;
}

export function AdminEditDocumentDialog({
  open,
  onOpenChange,
  document,
  onSuccess,
}: AdminEditDocumentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto sm:max-h-[90vh]">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Pencil className="h-6 w-6" />
            Edit {document.document_type === "Ebooks" ? "Ebook" : "Journal"}
          </DialogTitle>
          <DialogDescription className="text-base">
            Update the document information below. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <AdminEditDocumentForm
            document={document}
            onSuccess={() => {
              onOpenChange(false);
              if (onSuccess) {
                onSuccess();
              }
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}


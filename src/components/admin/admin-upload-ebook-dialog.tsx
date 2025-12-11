"use client";

import * as React from "react";
import { Upload, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AdminUploadEbookForm } from "@/components/forms/admin-upload-ebook-form";

export function AdminUploadEbookDialogTrigger() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Ebook/Journal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto sm:max-h-[90vh]">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Upload Ebook/Journal
          </DialogTitle>
          <DialogDescription className="text-base">
            Upload an ebook or journal document. Select the document type and fill in the required information below.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <AdminUploadEbookForm
            onSuccess={() => {
              setOpen(false);
              window.location.reload();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}


"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BookCreationForm } from "@/components/forms/book-creation-form";

export function CreateBookDialog() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const handleSuccess = React.useCallback(() => {
    setOpen(false);
    router.refresh();
  }, [router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Book
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto sm:max-h-[90vh]">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold">
            Create New Book
          </DialogTitle>
          <DialogDescription className="text-base">
            Fill in the information below to add a new book to the library
            system. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <BookCreationForm onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

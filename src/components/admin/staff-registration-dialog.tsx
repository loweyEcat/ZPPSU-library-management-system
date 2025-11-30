"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StaffRegistrationForm } from "@/components/forms/staff-registration-form";

export function StaffRegistrationDialog() {
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
          <UserPlus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto sm:max-h-[90vh]">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold">Create Staff Account</DialogTitle>
          <DialogDescription className="text-base">
            Fill in the information below to create a new staff member account.
            The staff member will be able to log in with their email and password.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <StaffRegistrationForm onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}


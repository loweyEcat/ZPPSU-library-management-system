"use client";

import * as React from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProfilePicturePreviewProps {
  imageUrl: string | null;
  name: string;
  initials: string;
  className?: string;
}

export function ProfilePicturePreview({
  imageUrl,
  name,
  initials,
  className,
}: ProfilePicturePreviewProps) {
  const [open, setOpen] = React.useState(false);

  if (!imageUrl) {
    return (
      <Avatar className={className}>
        <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
        >
          <Avatar className={className}>
            <AvatarImage src={imageUrl} alt={name} className="object-cover" />
            <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 bg-transparent border-none shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Profile Picture Preview - {name}</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-full max-h-[90vh] flex items-center justify-center">
          <Image
            src={imageUrl}
            alt={name}
            width={800}
            height={800}
            className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg"
            unoptimized
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}


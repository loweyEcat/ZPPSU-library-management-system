import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
};

export function Logo({ size = "md", className, showText = false }: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("relative flex-shrink-0", sizeClasses[size])}>
        <Image
          src="/images/tfoe-pe-logo.png"
          alt="The Fraternal Order Of Eagles - Philippine Eagles International, Inc."
          width={96}
          height={96}
          className="h-full w-full object-contain"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-sm font-bold uppercase tracking-wide text-foreground">
            The Fraternal Order Of Eagles
          </span>
          <span className="text-lg font-bold uppercase tracking-wider text-primary">
            Philippine Eagles International, Inc.
          </span>
        </div>
      )}
    </div>
  );
}


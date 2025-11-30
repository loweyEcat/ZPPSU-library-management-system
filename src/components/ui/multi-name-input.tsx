"use client";

import * as React from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MultiNameInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxNames?: number;
  className?: string;
}

export function MultiNameInput({
  value,
  onChange,
  placeholder = "Enter researcher name and press Enter",
  disabled = false,
  maxNames,
  className,
}: MultiNameInputProps) {
  const [inputValue, setInputValue] = React.useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addName(inputValue.trim());
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      // Remove last name if backspace is pressed on empty input
      removeName(value.length - 1);
    }
  };

  const addName = (name: string) => {
    if (!name) return;
    
    // Validate name (only letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(name)) {
      return;
    }

    // Check if name already exists
    if (value.includes(name)) {
      return;
    }

    // Check max names limit
    if (maxNames && value.length >= maxNames) {
      return;
    }

    // Check character limit (500 chars total including ", " separators)
    const currentTotal = value.length > 0 ? value.join(", ").length : 0;
    const newTotal = currentTotal + (value.length > 0 ? 2 : 0) + name.length; // +2 for ", " separator
    if (newTotal > 500) {
      return;
    }

    onChange([...value, name]);
    setInputValue("");
  };

  const removeName = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleInputBlur = () => {
    // Add name when input loses focus if there's a value
    if (inputValue.trim()) {
      addName(inputValue.trim());
    }
  };

  // Calculate total character count (including commas and spaces)
  const totalChars = React.useMemo(() => {
    if (value.length === 0) return 0;
    // Join with ", " (comma and space) for accurate count
    return value.join(", ").length;
  }, [value]);

  const maxChars = 500;
  const remainingChars = maxChars - totalChars;
  const isNearLimit = remainingChars < 50;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2 p-2 min-h-[44px] border rounded-md bg-background">
        {value.map((name, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1 text-sm"
          >
            {name}
            <button
              type="button"
              onClick={() => removeName(index)}
              disabled={disabled}
              className="ml-1 rounded-full hover:bg-destructive/20 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleInputBlur}
          placeholder={value.length === 0 ? placeholder : "Add another name..."}
          disabled={disabled || (maxNames ? value.length >= maxNames : false) || remainingChars <= 0}
          className="flex-1 min-w-[150px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0"
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {maxNames && (
            <p className="text-xs text-muted-foreground">
              {value.length} / {maxNames} researchers
            </p>
          )}
          {value.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Press Enter or click outside the input to add a name
            </p>
          )}
        </div>
        {value.length > 0 && (
          <p
            className={cn(
              "text-xs",
              remainingChars < 0
                ? "text-destructive font-medium"
                : isNearLimit
                ? "text-orange-600 font-medium"
                : "text-muted-foreground"
            )}
          >
            {remainingChars >= 0
              ? `${remainingChars} characters remaining`
              : `${Math.abs(remainingChars)} characters over limit`}
          </p>
        )}
      </div>
    </div>
  );
}


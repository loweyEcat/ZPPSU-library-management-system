"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Lock, Clock, Shield } from "lucide-react";
import {
  toggleDocumentRestriction,
  setDocumentTimeLimit,
  setDocumentMaxAttempts,
} from "@/app/admin/resources/actions";
import { toast } from "sonner";

interface DocumentRestrictionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: number;
  isRestricted: boolean;
  timeLimitMinutes: number | null;
  maxAttempts: number | null;
  onSuccess?: () => void;
}

export function DocumentRestrictionDialog({
  open,
  onOpenChange,
  documentId,
  isRestricted,
  timeLimitMinutes,
  maxAttempts,
  onSuccess,
}: DocumentRestrictionDialogProps) {
  const [isToggling, setIsToggling] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [restrictionEnabled, setRestrictionEnabled] =
    React.useState(isRestricted);
  const [timeLimit, setTimeLimit] = React.useState<string>(
    timeLimitMinutes?.toString() || "60"
  );
  const [useTimeLimit, setUseTimeLimit] = React.useState(
    timeLimitMinutes !== null
  );
  const [maxAttemptsValue, setMaxAttemptsValue] = React.useState<string>(
    maxAttempts?.toString() || ""
  );
  const [useMaxAttempts, setUseMaxAttempts] = React.useState(
    maxAttempts !== null
  );

  React.useEffect(() => {
    setRestrictionEnabled(isRestricted);
    setTimeLimit(timeLimitMinutes?.toString() || "60");
    setUseTimeLimit(timeLimitMinutes !== null);
    setMaxAttemptsValue(maxAttempts?.toString() || "");
    setUseMaxAttempts(maxAttempts !== null);
  }, [isRestricted, timeLimitMinutes, maxAttempts, open]);

  const handleToggleRestriction = async () => {
    setIsToggling(true);
    try {
      const result = await toggleDocumentRestriction(documentId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setRestrictionEnabled(result.is_restricted);
        toast.success(
          result.is_restricted
            ? "Document restriction enabled"
            : "Document restriction disabled"
        );
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      toast.error("Failed to toggle restriction");
    } finally {
      setIsToggling(false);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Validate time limit if enabled
      if (useTimeLimit) {
        const minutes = parseInt(timeLimit);
        if (isNaN(minutes) || minutes <= 0) {
          toast.error("Please enter a valid time limit in minutes");
          setIsSaving(false);
          return;
        }
      }

      // Validate max attempts if enabled
      if (useMaxAttempts) {
        const attempts = parseInt(maxAttemptsValue);
        if (isNaN(attempts) || attempts <= 0 || attempts > 100) {
          toast.error("Please enter a valid number of attempts (1-100)");
          setIsSaving(false);
          return;
        }
      }

      // Save time limit
      const timeLimitResult = await setDocumentTimeLimit(
        documentId,
        useTimeLimit ? parseInt(timeLimit) : null
      );
      if (timeLimitResult.error) {
        toast.error(timeLimitResult.error);
        setIsSaving(false);
        return;
      }

      // Save max attempts
      const maxAttemptsResult = await setDocumentMaxAttempts(
        documentId,
        useMaxAttempts ? parseInt(maxAttemptsValue) : null
      );
      if (maxAttemptsResult.error) {
        toast.error(maxAttemptsResult.error);
        setIsSaving(false);
        return;
      }

      // Show success message
      const changes: string[] = [];
      if (timeLimitResult.time_limit_minutes) {
        changes.push(
          `Time limit: ${timeLimitResult.time_limit_minutes} minutes`
        );
      } else if (!useTimeLimit && timeLimitMinutes !== null) {
        changes.push("Time limit removed");
      }
      if (maxAttemptsResult.max_attempts) {
        changes.push(`Max attempts: ${maxAttemptsResult.max_attempts}`);
      } else if (!useMaxAttempts && maxAttempts !== null) {
        changes.push("Max attempts removed");
      }

      if (changes.length > 0) {
        toast.success(`Settings saved: ${changes.join(", ")}`);
      } else {
        toast.success("Settings saved");
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Document Restriction Settings
          </DialogTitle>
          <DialogDescription>
            Control access to this document and set reading time limits for
            students.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Restriction Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="restriction"
                  className="text-base font-semibold"
                >
                  Restrict Access
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, only the document owner (student) can preview
                  this document.
                </p>
              </div>
              <Switch
                id="restriction"
                checked={restrictionEnabled}
                onCheckedChange={handleToggleRestriction}
                disabled={isToggling}
              />
            </div>
            {restrictionEnabled && (
              <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-900 dark:text-blue-100">
                <p>
                  This document is restricted. Only the student who uploaded it
                  can access it.
                </p>
              </div>
            )}
          </div>

          {/* Time Limit Settings */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="time-limit-toggle"
                  className="text-base font-semibold flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Enable Time Limit
                </Label>
                <p className="text-sm text-muted-foreground">
                  Set a maximum reading time. Students will be automatically
                  logged out after the time limit.
                </p>
              </div>
              <Switch
                id="time-limit-toggle"
                checked={useTimeLimit}
                onCheckedChange={setUseTimeLimit}
                disabled={isSaving}
              />
            </div>

            {useTimeLimit && (
              <div className="space-y-2">
                <Label htmlFor="time-limit-input">Time Limit (minutes)</Label>
                <Input
                  id="time-limit-input"
                  type="number"
                  min="1"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  placeholder="60"
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">
                  Default: 60 minutes (1 hour)
                </p>
              </div>
            )}
          </div>

          {/* Max Attempts Settings */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="max-attempts-toggle"
                  className="text-base font-semibold flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Enable Max Attempts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Set a maximum number of times a student can open this
                  document. After reaching the limit, students must wait 24
                  hours before accessing again.
                </p>
              </div>
              <Switch
                id="max-attempts-toggle"
                checked={useMaxAttempts}
                onCheckedChange={setUseMaxAttempts}
                disabled={isSaving}
              />
            </div>

            {useMaxAttempts && (
              <div className="space-y-2">
                <Label htmlFor="max-attempts-input">Max Attempts</Label>
                <Input
                  id="max-attempts-input"
                  type="number"
                  min="1"
                  max="100"
                  value={maxAttemptsValue}
                  onChange={(e) => setMaxAttemptsValue(e.target.value)}
                  placeholder="5"
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">
                  Students will be locked out for 24 hours after reaching this
                  limit.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveAll} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save All Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

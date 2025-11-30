"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { verifyBookReturn } from "@/app/dashboard/staff/books-requested/actions";

interface BookRequest {
  id: number;
  tracking_number: string;
  quantity: number | null;
  book: {
    id: number;
    books_name: string;
    author_name: string;
    isbn: string;
  };
  student: {
    id: number;
    full_name: string;
    email: string;
  };
}

interface VerifyBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: BookRequest;
  onSuccess?: () => void;
}

export function VerifyBookDialog({
  open,
  onOpenChange,
  request,
  onSuccess,
}: VerifyBookDialogProps) {
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isDamaged, setIsDamaged] = React.useState(false);
  const [isLost, setIsLost] = React.useState(false);
  const [isReturnedSuccessfully, setIsReturnedSuccessfully] =
    React.useState(false);
  const [damagedQuantity, setDamagedQuantity] = React.useState("0");
  const [lostQuantity, setLostQuantity] = React.useState("0");
  const [damageDescription, setDamageDescription] = React.useState("");
  const [fineAmount, setFineAmount] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setIsDamaged(false);
      setIsLost(false);
      setIsReturnedSuccessfully(false);
      setDamagedQuantity("0");
      setLostQuantity("0");
      setDamageDescription("");
      setFineAmount("");
      setDueDate("");
    }
  }, [open]);

  const handleVerify = async () => {
    const totalQuantity = request.quantity || 1;
    const damagedQty = parseInt(damagedQuantity) || 0;
    const lostQty = parseInt(lostQuantity) || 0;
    const receivedQty = totalQuantity - damagedQty - lostQty;

    // Validate quantities
    if (damagedQty < 0 || lostQty < 0) {
      toast.error("Quantities cannot be negative.");
      return;
    }

    if (damagedQty + lostQty > totalQuantity) {
      toast.error(
        `Total damaged/lost (${
          damagedQty + lostQty
        }) cannot exceed borrowed quantity (${totalQuantity}).`
      );
      return;
    }

    if (receivedQty < 0) {
      toast.error("Received quantity cannot be negative.");
      return;
    }

    // At least some books should be received, damaged, or lost
    if (receivedQty === 0 && damagedQty === 0 && lostQty === 0) {
      toast.error("Please specify the condition of the returned books.");
      return;
    }

    // Validate fine details if there are damaged or lost books
    if (damagedQty > 0 || lostQty > 0) {
      if (!fineAmount || parseFloat(fineAmount) <= 0) {
        toast.error("Please enter a valid fine amount per book.");
        return;
      }
      if (!damageDescription.trim()) {
        toast.error("Please provide a description of the damage or loss.");
        return;
      }
    }

    setIsVerifying(true);
    try {
      // Calculate total fine amount (fine per book × quantity of damaged/lost)
      const finePerBook = parseFloat(fineAmount) || 0;
      const totalFineAmount = finePerBook * (damagedQty + lostQty);

      const result = await verifyBookReturn(request.id, {
        damagedQuantity: damagedQty,
        lostQuantity: lostQty,
        receivedQuantity: receivedQty,
        damageDescription: damageDescription.trim() || undefined,
        fineAmount: damagedQty > 0 || lostQty > 0 ? totalFineAmount : undefined,
        dueDate: dueDate || undefined,
      });

      if (result.success) {
        toast.success(result.message || "Book verified successfully!");
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(result.message || "Failed to verify book.");
      }
    } catch (error) {
      console.error("Error verifying book:", error);
      toast.error("An error occurred while verifying the book.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Calculate default due date (30 days from now)
  React.useEffect(() => {
    if (open && (isDamaged || isLost) && !dueDate) {
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 30);
      setDueDate(defaultDueDate.toISOString().split("T")[0]);
    }
  }, [open, isDamaged, isLost, dueDate]);

  const totalQuantity = request.quantity || 1;
  const damagedQty = parseInt(damagedQuantity) || 0;
  const lostQty = parseInt(lostQuantity) || 0;
  const receivedQty = totalQuantity - damagedQty - lostQty;

  // Handle checkbox changes - allow multiple selections now
  const handleCheckboxChange = (type: "damaged" | "lost" | "success") => {
    if (type === "damaged") {
      setIsDamaged(!isDamaged);
      if (!isDamaged && damagedQty === 0) {
        setDamagedQuantity("1");
      }
    } else if (type === "lost") {
      setIsLost(!isLost);
      if (!isLost && lostQty === 0) {
        setLostQuantity("1");
      }
    } else {
      setIsReturnedSuccessfully(!isReturnedSuccessfully);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verify Book Return</DialogTitle>
          <DialogDescription>
            Review the returned book and check for any damages, if it's lost, or
            if it was returned successfully.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Book Information */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Book Information</Label>
            <div className="rounded-lg border p-3 bg-muted/50">
              <p className="font-medium">{request.book.books_name}</p>
              <p className="text-sm text-muted-foreground">
                by {request.book.author_name}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                ISBN: {request.book.isbn}
              </p>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                Tracking: {request.tracking_number}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Quantity Borrowed:{" "}
                <span className="font-semibold">{request.quantity || 1}</span>
              </p>
            </div>
          </div>

          {/* Student Information */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Student</Label>
            <div className="rounded-lg border p-3 bg-muted/50">
              <p className="font-medium">{request.student.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {request.student.email}
              </p>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold">
              Book Condition Checklist
            </Label>

            {/* Damage Checkbox with Quantity */}
            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
              <Checkbox
                id="damaged"
                checked={isDamaged}
                onCheckedChange={(checked) => {
                  handleCheckboxChange("damaged");
                }}
              />
              <div className="space-y-2 leading-none flex-1">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="damaged"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                  >
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Books are Damaged
                  </Label>
                  {isDamaged && (
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="damaged-qty"
                        className="text-xs text-muted-foreground"
                      >
                        Quantity:
                      </Label>
                      <Input
                        id="damaged-qty"
                        type="number"
                        min="0"
                        max={totalQuantity - lostQty}
                        value={damagedQuantity}
                        onChange={(e) => {
                          const val = Math.max(
                            0,
                            Math.min(
                              totalQuantity - lostQty,
                              parseInt(e.target.value) || 0
                            )
                          );
                          setDamagedQuantity(val.toString());
                        }}
                        className="w-20 h-8"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Check if any books have physical damage
                </p>
              </div>
            </div>

            {/* Lost Checkbox with Quantity */}
            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
              <Checkbox
                id="lost"
                checked={isLost}
                onCheckedChange={(checked) => {
                  handleCheckboxChange("lost");
                }}
              />
              <div className="space-y-2 leading-none flex-1">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="lost"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                  >
                    <XCircle className="h-4 w-4 text-red-500" />
                    Books are Lost
                  </Label>
                  {isLost && (
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="lost-qty"
                        className="text-xs text-muted-foreground"
                      >
                        Quantity:
                      </Label>
                      <Input
                        id="lost-qty"
                        type="number"
                        min="0"
                        max={totalQuantity - damagedQty}
                        value={lostQuantity}
                        onChange={(e) => {
                          const val = Math.max(
                            0,
                            Math.min(
                              totalQuantity - damagedQty,
                              parseInt(e.target.value) || 0
                            )
                          );
                          setLostQuantity(val.toString());
                        }}
                        className="w-20 h-8"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Check if any books were not returned
                </p>
              </div>
            </div>

            {/* Received Summary */}
            {receivedQty > 0 && (
              <div className="rounded-md border p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <Label className="text-sm font-medium text-green-900 dark:text-green-100">
                    Books to be Received:{" "}
                    <span className="font-bold">{receivedQty}</span> of{" "}
                    {totalQuantity}
                  </Label>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  {receivedQty} book{receivedQty !== 1 ? "s" : ""} will be
                  marked as received in good condition
                </p>
              </div>
            )}
          </div>

          {/* Damage/Loss Details */}
          {(isDamaged || isLost) && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description / Remarks{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the damage or loss details. This will be shown to the student as a remark..."
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fineAmount">
                    Fine Amount (Per Book){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fineAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={fineAmount}
                    onChange={(e) => setFineAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Payment charge per book
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">
                    Payment Due Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <p className="text-xs text-muted-foreground">
                    When the student should pay
                  </p>
                </div>
              </div>

              {/* Total Fine Amount Display */}
              {fineAmount &&
                parseFloat(fineAmount) > 0 &&
                (damagedQty > 0 || lostQty > 0) && (
                  <div className="space-y-2">
                    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-semibold text-muted-foreground">
                            Total Fine Amount
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Fine per book × ({damagedQty} damaged + {lostQty}{" "}
                            lost) = {damagedQty + lostQty} book
                            {damagedQty + lostQty !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(
                              parseFloat(fineAmount) * (damagedQty + lostQty)
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isVerifying}
          >
            Cancel
          </Button>
          <Button onClick={handleVerify} disabled={isVerifying}>
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Verify Book
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

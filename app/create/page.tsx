"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/date-picker"
import { useToast } from "@/hooks/use-toast"
import { createGoal } from "@/lib/api/createGoal"
import { createGoalOnChain } from "@/lib/contracts/createGoalOnChain"
import { useAuth } from "@/components/providers/auth-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import DOMPurify from 'dompurify'; // Still needed here for final sanitization before sending data
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { validateField, validateForm, GoalFormData, FormErrors } from "@/lib/validation";

export default function CreateGoalPage() {
  const { isAuthenticated, walletAddress, userAddress, signer, isWalletConnecting } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [formData, setFormData] = useState<GoalFormData>({
    title: "",
    description: "",
    deadline: new Date(),
    stake: "",
    refereeAddress: "",
    successRecipientAddress: "",
    failureRecipientAddress: "",
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})


  useEffect(() => {
    if (walletAddress && formData.successRecipientAddress === "") {
      setFormData((prev) => ({ ...prev, successRecipientAddress: walletAddress }));
    }
  }, [walletAddress, formData.successRecipientAddress]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, deadline: date }));
      setFormErrors((prev) => ({ ...prev, deadline: undefined })); // Clear error on valid date selection
    } else {
      setFormData((prev) => ({ ...prev, deadline: new Date() }));
      setFormErrors((prev) => ({ ...prev, deadline: "Deadline is required." }));
    }
  };

  const handleBlur = (name: keyof GoalFormData) => {
    const value = formData[name];
    const error = validateField(name, value, walletAddress);
    setFormErrors((prev) => ({ ...prev, [name]: error })); // Update errors state for specific field
  };

  // Callback to determine if the form is generally valid for enabling/disabling the submit button
  const isFormValid = useCallback(() => {
    // Check if there are no error messages currently present in the formErrors state
    const hasNoErrors = Object.values(formErrors).every(error => !error);

    // Also perform a basic check that all required fields are filled (even if no blur validation triggered yet)
    const allRequiredFieldsFilled = Object.values(formData).every(value => {
      // Special handling for Date objects: ensure it's a valid date
      if (value instanceof Date) return !isNaN(value.getTime());
      // For strings, check if trimmed value is not empty; otherwise, check for null/undefined
      return typeof value === 'string' ? value.trim() !== '' : value !== null && value !== undefined;
    });

    return hasNoErrors && allRequiredFieldsFilled;
  }, [formData, formErrors]); // Dependencies for useCallback

  // Main form submission handler - now first validates, then opens confirmation dialog
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Perform a full form validation using the extracted function
    const { isValid, errors } = validateForm(formData, walletAddress);
    setFormErrors(errors); // Update the errors state to display all errors

    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form.",
        variant: "destructive",
      });
      return; // Stop execution if validation fails
    }

    // Authentication and wallet connection checks
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a goal.",
        variant: "destructive",
      });
      return;
    }

    if (!walletAddress || !signer) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet and ensure it's ready to stake ETH.",
        variant: "destructive",
      });
      return;
    }

    setShowConfirmationDialog(true);
  };

  const handleConfirmCreateGoal = async () => {
    setIsSubmitting(true);

    try {
      // Apply final XSS sanitization to all string inputs before sending to blockchain/DB
      const sanitizedTitle = DOMPurify.sanitize(formData.title);
      const sanitizedDescription = DOMPurify.sanitize(formData.description);
      const sanitizedRefereeAddress = DOMPurify.sanitize(formData.refereeAddress);
      const sanitizedSuccessRecipientAddress = DOMPurify.sanitize(formData.successRecipientAddress);
      const sanitizedFailureRecipientAddress = DOMPurify.sanitize(formData.failureRecipientAddress);

      // Phase 1: Create the goal on the blockchain via contract interaction
      
      const { receipt, contractGoalId } = await createGoalOnChain({
        description: sanitizedDescription,
        deadline: formData.deadline,
        stake: formData.stake,
        refereeAddress: sanitizedRefereeAddress,
        successRecipientAddress: sanitizedSuccessRecipientAddress,
        failureRecipientAddress: sanitizedFailureRecipientAddress,
        signer: signer!, // 'signer' is guaranteed non-null due to prior checks
      });

      console.log("Blockchain transaction confirmed:", receipt);
      console.log("Extracted Contract Goal ID:", contractGoalId);


      const goal = await createGoal({
        title: sanitizedTitle,
        description: sanitizedDescription,
        expiry_date: formData.deadline.toISOString(),
        refereeAddress: sanitizedRefereeAddress,
        successRecipientAddress: sanitizedSuccessRecipientAddress,
        failureRecipientAddress: sanitizedFailureRecipientAddress,
        stakeAmount: formData.stake,
        contractGoalId: contractGoalId, 
        transactionHash: receipt.hash,
      });

      toast({
        title: "Goal created successfully!",
        description: "Your ETH has been staked in the escrow contract and saved to our database.",
      });

    } catch (error: any) {
      console.error("Error creating goal:", error);
      let errorMessage = "Please try again.";
      if (error.code === 4001) { // User rejected transaction in wallet
        errorMessage = "Transaction was rejected by your wallet.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Failed to create goal",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirmationDialog(false);
    }
  };

  if (isWalletConnecting) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Connecting your wallet...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication required</AlertTitle>
            <AlertDescription>Please connect your wallet and sign in to create a goal.</AlertDescription>
          </Alert>
          <Button className="mt-4" onClick={() => router.push("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New Goal</CardTitle>
            <CardDescription>Set your goal, stake ETH, and assign a referee to verify completion</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="E.g., Complete 30 days of coding"
                  value={formData.title}
                  onChange={handleChange}
                  onBlur={() => handleBlur('title')} 
                  required
                />
                {formErrors.title && (
                  <p className="text-sm text-red-500">{formErrors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your goal in detail, including how it will be verified"
                  value={formData.description}
                  onChange={handleChange}
                  onBlur={() => handleBlur('description')}
                  required
                />
                {formErrors.description && (
                  <p className="text-sm text-red-500">{formErrors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <DatePicker date={formData.deadline} setDate={handleDateChange} />
                  {formErrors.deadline && (
                    <p className="text-sm text-red-500">{formErrors.deadline}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stake">Stake Amount (ETH)</Label>
                  <Input
                    id="stake"
                    name="stake"
                    type="number"
                    step="0.01"
                    min="0.001"
                    placeholder="0.5"
                    value={formData.stake}
                    onChange={handleChange}
                    onBlur={() => handleBlur('stake')}
                    required
                  />
                  {formErrors.stake && (
                    <p className="text-sm text-red-500">{formErrors.stake}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refereeAddress">Referee Wallet Address</Label>
                <Input
                  id="refereeAddress"
                  name="refereeAddress"
                  placeholder="0x..."
                  value={formData.refereeAddress}
                  onChange={handleChange}
                  onBlur={() => handleBlur('refereeAddress')}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  This person will verify whether you've completed your goal.
                </p>
                {formErrors.refereeAddress && (
                  <p className="text-sm text-red-500">{formErrors.refereeAddress}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="successRecipientAddress">Success Recipient Address</Label>
                <Input
                  id="successRecipientAddress"
                  name="successRecipientAddress"
                  placeholder="0x..."
                  value={formData.successRecipientAddress}
                  onChange={handleChange}
                  onBlur={() => handleBlur('successRecipientAddress')} 
                  required
                />
                <p className="text-sm text-muted-foreground">
                  The address that receives the staked ETH if you successfully complete the goal. Defaults to your wallet.
                </p>
                {formErrors.successRecipientAddress && (
                  <p className="text-sm text-red-500">{formErrors.successRecipientAddress}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="failureRecipientAddress">Failure Recipient Address</Label>
                <Input
                  id="failureRecipientAddress"
                  name="failureRecipientAddress"
                  placeholder="0x..."
                  value={formData.failureRecipientAddress}

                  onChange={handleChange}
                  onBlur={() => handleBlur('failureRecipientAddress')} // Validation on blur
                  required
                />
                <p className="text-sm text-muted-foreground">
                  The address that receives the staked ETH if you fail to complete the goal.
                </p>
                {formErrors.failureRecipientAddress && (
                  <p className="text-sm text-red-500">{formErrors.failureRecipientAddress}</p>
                )}
              </div>

            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.push("/")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !isFormValid()}>
                Create & Stake ETH
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <AlertDialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Goal Creation & ETH Stake</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Please review the details below before proceeding. Once confirmed, your ETH will be staked on the blockchain.</p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li><strong>Goal Title:</strong> {DOMPurify.sanitize(formData.title)}</li>
                <li><strong>Stake Amount:</strong> {formData.stake} ETH</li>
                <li><strong>Deadline:</strong> {formData.deadline.toLocaleDateString()}</li>
                <li><strong>Referee Address:</strong> {DOMPurify.sanitize(formData.refereeAddress)}</li>
                <li><strong>Success Recipient:</strong> {DOMPurify.sanitize(formData.successRecipientAddress)}</li>
                <li><strong>Failure Recipient:</strong> {DOMPurify.sanitize(formData.failureRecipientAddress)}</li>
              </ul>
              <p className="font-semibold text-destructive">
                Ensure all addresses are correct. This action cannot be reversed on-chain.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCreateGoal} disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Confirm & Stake"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
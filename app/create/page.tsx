// src/app/create-goal/page.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ethers } from "ethers"; // Assuming ethers is still needed for any local parsing (though now mostly in contract-interactions)
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/date-picker"
import { useToast } from "@/hooks/use-toast"
import { createGoal } from "@/lib/database"
import { createGoalOnChain } from "@/lib/contract-interactions"
import { useAuth } from "@/components/providers/auth-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import DOMPurify from 'dompurify';

// NEW: Import AlertDialog components
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

export default function CreateGoalPage() {
  const { isAuthenticated, walletAddress, userAddress, signer, isWalletConnecting } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [isSubmitting, setIsSubmitting] = useState(false)
  // NEW: State to control the confirmation dialog visibility
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: new Date(),
    stake: "",
    refereeAddress: "",
    successRecipientAddress: "",
    failureRecipientAddress: "",
  })

  useEffect(() => {
    // Set default successRecipientAddress when walletAddress becomes available
    // and only if it hasn't been set by the user or already defaulted
    if (walletAddress && formData.successRecipientAddress === "") {
      setFormData((prev) => ({ ...prev, successRecipientAddress: walletAddress }));
    }
  }, [walletAddress, formData.successRecipientAddress]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, deadline: date }))
    }
  }

  // This function now *only* opens the confirmation dialog
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic authentication and wallet checks moved here, before opening dialog
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

    // NEW: Open the confirmation dialog
    setShowConfirmationDialog(true);
  };

  // NEW: This function handles the actual blockchain transaction and DB write
  const handleConfirmCreateGoal = async () => {
    setIsSubmitting(true); // Indicate that the submission process has started

    try {
      // Sanitize all relevant string inputs right before use
      const sanitizedTitle = DOMPurify.sanitize(formData.title);
      const sanitizedDescription = DOMPurify.sanitize(formData.description);
      const sanitizedRefereeAddress = DOMPurify.sanitize(formData.refereeAddress);
      const sanitizedSuccessRecipientAddress = DOMPurify.sanitize(formData.successRecipientAddress);
      const sanitizedFailureRecipientAddress = DOMPurify.sanitize(formData.failureRecipientAddress);

      // Phase 1: Create the goal on the blockchain
      const { receipt, contractGoalId } = await createGoalOnChain({
        title: sanitizedTitle,
        description: sanitizedDescription,
        deadline: formData.deadline,
        stake: formData.stake,
        refereeAddress: sanitizedRefereeAddress,
        successRecipientAddress: sanitizedSuccessRecipientAddress,
        failureRecipientAddress: sanitizedFailureRecipientAddress,
        signer: signer!, // Use non-null assertion as signer is checked before dialog opens
      });

      console.log("Blockchain transaction confirmed:", receipt);
      console.log("Extracted Contract Goal ID:", contractGoalId);

      // Phase 2: Store the goal in Supabase (ONLY if blockchain was successful)
      const goal = await createGoal({
        title: sanitizedTitle,
        description: sanitizedDescription,
        deadline: formData.deadline.toISOString(),
        creator_id: userAddress!, // Use non-null assertion as userAddress is from isAuthenticated
        referee_id: null,
        stake_amount: formData.stake,
        status: "active",
        contract_goal_id: contractGoalId,
      });

      toast({
        title: "Goal created successfully!",
        description: "Your ETH has been staked in the escrow contract and saved to our database.",
      });

      router.push(`/goals/${goal.id}`);
    } catch (error: any) {
      console.error("Error creating goal:", error);
      let errorMessage = "Please try again.";
      if (error.code === 4001) {
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
      setIsSubmitting(false); // Reset submitting state
      setShowConfirmationDialog(false); // Close the dialog
    }
  };

  // Display conditions for the form
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
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New Goal</CardTitle>
            <CardDescription>Set your goal, stake ETH, and assign a referee to verify completion</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}> {/* This now opens the dialog */}
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="E.g., Complete 30 days of coding"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your goal in detail, including how it will be verified"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <DatePicker date={formData.deadline} setDate={handleDateChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stake">Stake Amount (ETH)</Label>
                  <Input
                    id="stake"
                    name="stake"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.5"
                    value={formData.stake}
                    onChange={handleChange}
                    required
                  />
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
                  required
                />
                <p className="text-sm text-muted-foreground">
                  This person will verify whether you've completed your goal.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="successRecipientAddress">Success Recipient Address</Label>
                <Input
                  id="successRecipientAddress"
                  name="successRecipientAddress"
                  placeholder="0x..."
                  value={formData.successRecipientAddress}
                  onChange={handleChange}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  The address that receives the staked ETH if you successfully complete the goal. Defaults to your wallet.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="failureRecipientAddress">Failure Recipient Address</Label>
                <Input
                  id="failureRecipientAddress"
                  name="failureRecipientAddress"
                  placeholder="0x..."
                  value={formData.failureRecipientAddress}
                  onChange={handleChange}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  The address that receives the staked ETH if you fail to complete the goal.
                </p>
              </div>

            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.push("/")}>
                Cancel
              </Button>
              {/* This button now triggers the confirmation dialog */}
              <Button type="submit" disabled={isSubmitting}>
                Create & Stake ETH
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* NEW: Confirmation Dialog */}
      <AlertDialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Goal Creation & ETH Stake</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Please review the details below before proceeding. Once confirmed, your ETH will be staked on the blockchain.</p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li><strong>Goal Title:</strong> {formData.title}</li>
                <li><strong>Stake Amount:</strong> {formData.stake} ETH</li>
                <li><strong>Deadline:</strong> {formData.deadline.toLocaleDateString()}</li>
                <li><strong>Referee Address:</strong> {formData.refereeAddress}</li>
                <li><strong>Success Recipient:</strong> {formData.successRecipientAddress}</li>
                <li><strong>Failure Recipient:</strong> {formData.failureRecipientAddress}</li>
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
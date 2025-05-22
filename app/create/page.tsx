// src/app/create-goal/page.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react" // Import useEffect
import { useRouter } from "next/navigation"
import { ethers } from "ethers"; // Import ethers for interface parsing if needed, though moved to contract-interactions
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
// Assuming abis import was only for event parsing which is now in contract-interactions.ts
// import { abis } from '@/lib/contracts'; // No longer needed directly here if event parsing moved

export default function CreateGoalPage() {
  // Destructure 'signer' and 'userAddress' from useAuth
  const { isAuthenticated, walletAddress, userAddress, signer, connectWallet, disconnectWallet, signIn, signOut, isSignInLoading, isWalletConnecting } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: new Date(),
    stake: "",
    refereeAddress: "",
    // NEW: Add success and failure recipient addresses to form data
    successRecipientAddress: "", // Will be defaulted by useEffect
    failureRecipientAddress: "",
  })

  // Set default successRecipientAddress when walletAddress becomes available
  useEffect(() => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Ensure user is authenticated
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a goal.",
        variant: "destructive",
      })
      return
    }

    // Ensure wallet is connected and signer is available
    if (!walletAddress || !signer) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet and ensure it's ready to stake ETH.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Phase 1: Create the goal on the blockchain
      // Now, createGoalOnChain directly returns the receipt and contractGoalId
      const { receipt, contractGoalId } = await createGoalOnChain({
        title: formData.title,
        description: formData.description,
        deadline: formData.deadline,
        stake: formData.stake,
        refereeAddress: formData.refereeAddress,
        successRecipientAddress: formData.successRecipientAddress, // Pass new address
        failureRecipientAddress: formData.failureRecipientAddress, // Pass new address
        signer: signer, // Pass the signer
      })

      console.log("Blockchain transaction confirmed:", receipt);
      console.log("Extracted Contract Goal ID:", contractGoalId);

      // Phase 2: Store the goal in Supabase (ONLY if blockchain was successful)
      const goal = await createGoal({
        title: formData.title,
        description: formData.description,
        deadline: formData.deadline.toISOString(),
        creator_id: userAddress, // Use userAddress from useAuth()
        referee_id: null, // We'll update this once we have a way to look up users by wallet address
        stake_amount: formData.stake,
        status: "active",
        contract_goal_id: contractGoalId, // Store the contract's unique goal ID
      })

      toast({
        title: "Goal created successfully!",
        description: "Your ETH has been staked in the escrow contract and saved to our database.",
      })

      router.push(`/goals/${goal.id}`)
    } catch (error: any) {
      console.error("Error creating goal:", error)
      let errorMessage = "Please try again."
      if (error.code === 4001) { // User rejected transaction in MetaMask
        errorMessage = "Transaction was rejected by your wallet."
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Failed to create goal",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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

              {/* NEW: Success Recipient Address */}
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

              {/* NEW: Failure Recipient Address */}
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create & Stake ETH"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
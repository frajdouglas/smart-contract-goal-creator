"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
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

export default function CreateGoalPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, walletAddress } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: new Date(),
    stake: "",
    refereeAddress: "",
  })

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

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a goal",
        variant: "destructive",
      })
      return
    }

    if (!walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to stake ETH",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // First create the goal on the blockchain
      const tx = await createGoalOnChain({
        title: formData.title,
        description: formData.description,
        deadline: formData.deadline,
        stake: formData.stake,
        refereeAddress: formData.refereeAddress,
      })

      // Then store the goal in Supabase
      const goal = await createGoal({
        title: formData.title,
        description: formData.description,
        deadline: formData.deadline.toISOString(),
        creator_id: user.id,
        referee_id: null, // We'll update this once we have a way to look up users by wallet address
        stake_amount: formData.stake,
        status: "active",
        contract_goal_id: tx.hash, // Store the transaction hash as reference
      })

      toast({
        title: "Goal created successfully!",
        description: "Your ETH has been staked in the escrow contract.",
      })

      router.push(`/goals/${goal.id}`)
    } catch (error: any) {
      toast({
        title: "Failed to create goal",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user || !walletAddress) {
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
                  This person will verify whether you've completed your goal
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

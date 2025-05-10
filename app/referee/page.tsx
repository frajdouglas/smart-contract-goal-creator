"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/providers/auth-provider"
import { getGoalsByReferee, updateGoalStatus } from "@/lib/database"
import { verifyGoalCompletion, rejectGoalCompletion } from "@/lib/contract-interactions"
import type { Goal } from "@/types/database"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RefereeDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchGoals = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const data = await getGoalsByReferee(user.id)
        setGoals(data)
      } catch (error) {
        console.error("Error fetching goals:", error)
        toast({
          title: "Error fetching goals",
          description: "Please try again later",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchGoals()
  }, [user, toast])

  const handleVerify = async (goal: Goal) => {
    if (!goal.contract_goal_id) {
      toast({
        title: "Cannot verify goal",
        description: "This goal is not linked to a blockchain contract",
        variant: "destructive",
      })
      return
    }

    try {
      // First update on blockchain
      await verifyGoalCompletion(goal.contract_goal_id)

      // Then update in database
      await updateGoalStatus(goal.id, "completed")

      // Update UI optimistically
      setGoals(goals.map((g) => (g.id === goal.id ? { ...g, status: "completed" } : g)))

      toast({
        title: "Goal verified successfully",
        description: "The staked ETH has been released to the creator",
      })
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (goal: Goal) => {
    if (!goal.contract_goal_id) {
      toast({
        title: "Cannot reject goal",
        description: "This goal is not linked to a blockchain contract",
        variant: "destructive",
      })
      return
    }

    try {
      // First update on blockchain
      await rejectGoalCompletion(goal.contract_goal_id)

      // Then update in database
      await updateGoalStatus(goal.id, "failed")

      // Update UI optimistically
      setGoals(goals.map((g) => (g.id === goal.id ? { ...g, status: "failed" } : g)))

      toast({
        title: "Goal rejected",
        description: "The goal has been marked as failed",
      })
    } catch (error: any) {
      toast({
        title: "Rejection failed",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    }
  }

  const pendingGoals = goals.filter((goal) => goal.status === "active" && goal.evidence)
  const completedGoals = goals.filter((goal) => goal.status === "completed")
  const failedGoals = goals.filter((goal) => goal.status === "failed")

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication required</AlertTitle>
            <AlertDescription>Please sign in to access the referee dashboard.</AlertDescription>
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
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Referee Dashboard</h1>
          <p className="text-muted-foreground">Verify goal completions and release staked ETH</p>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="pending">Pending ({pendingGoals.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedGoals.length})</TabsTrigger>
            <TabsTrigger value="failed">Failed ({failedGoals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {loading ? (
              <p className="text-center py-8">Loading pending goals...</p>
            ) : pendingGoals.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No goals pending verification</p>
            ) : (
              pendingGoals.map((goal) => (
                <Card key={goal.id} className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <Badge variant="outline">Pending Verification</Badge>
                    </div>
                    <CardDescription>{goal.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Deadline</p>
                          <p className="font-medium">
                            {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : "No deadline"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Stake</p>
                          <p className="font-medium">{goal.stake_amount} ETH</p>
                        </div>
                      </div>

                      <div className="text-sm">
                        <p className="text-muted-foreground">Evidence</p>
                        <p className="font-medium break-words">{goal.evidence}</p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button className="flex-1" onClick={() => handleVerify(goal)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Verify Completion
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={() => handleReject(goal)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>

                      <Button variant="link" asChild className="w-full">
                        <Link href={`/goals/${goal.id}`}>View Full Details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed">
            {loading ? (
              <p className="text-center py-8">Loading completed goals...</p>
            ) : completedGoals.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No completed goals</p>
            ) : (
              completedGoals.map((goal) => (
                <Card key={goal.id} className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <Badge className="bg-green-500">Completed</Badge>
                    </div>
                    <CardDescription>{goal.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Deadline</p>
                          <p className="font-medium">
                            {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : "No deadline"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Stake</p>
                          <p className="font-medium">{goal.stake_amount} ETH</p>
                        </div>
                      </div>

                      <Button variant="link" asChild className="w-full">
                        <Link href={`/goals/${goal.id}`}>View Full Details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="failed">
            {loading ? (
              <p className="text-center py-8">Loading failed goals...</p>
            ) : failedGoals.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No failed goals</p>
            ) : (
              failedGoals.map((goal) => (
                <Card key={goal.id} className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <Badge className="bg-red-500">Failed</Badge>
                    </div>
                    <CardDescription>{goal.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Deadline</p>
                          <p className="font-medium">
                            {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : "No deadline"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Stake</p>
                          <p className="font-medium">{goal.stake_amount} ETH</p>
                        </div>
                      </div>

                      <Button variant="link" asChild className="w-full">
                        <Link href={`/goals/${goal.id}`}>View Full Details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

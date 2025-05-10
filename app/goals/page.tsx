"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, ArrowLeft, Clock, Plus } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/providers/auth-provider"
import { getGoalsByUser } from "@/lib/database"
import type { Goal } from "@/types/database"
import { useRouter } from "next/navigation"

export default function GoalsPage() {
  const router = useRouter()
  const { user, walletAddress } = useAuth()
  const [goals, setGoals] = useState<Goal[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch goals from Supabase when user is available
    const fetchGoals = async () => {
      if (!user) {
        setGoals([])
        setLoading(false)
        return
      }

      try {
        const data = await getGoalsByUser(user.id)
        setGoals(data)
      } catch (error) {
        console.error("Error fetching goals:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchGoals()
  }, [user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-500"
      case "completed":
        return "bg-green-500"
      case "failed":
        return "bg-red-500"
      default:
        return "bg-yellow-500"
    }
  }

  // Calculate progress based on deadline
  const calculateProgress = (goal: Goal) => {
    if (!goal.deadline) return 0

    const now = new Date()
    const created = new Date(goal.created_at)
    const deadline = new Date(goal.deadline)

    // If deadline has passed
    if (now > deadline) return 100

    // Calculate progress as percentage of time elapsed
    const totalDuration = deadline.getTime() - created.getTime()
    const elapsedDuration = now.getTime() - created.getTime()

    return Math.min(Math.round((elapsedDuration / totalDuration) * 100), 100)
  }

  const filterGoals = (status: string) => {
    if (!goals) return []
    return goals.filter((goal) => goal.status === status)
  }

  const activeGoals = filterGoals("active")
  const completedGoals = filterGoals("completed")
  const failedGoals = filterGoals("failed")

  const GoalCard = ({ goal }: { goal: Goal }) => (
    <Card key={goal.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{goal.title}</CardTitle>
          <Badge className={getStatusColor(goal.status)}>
            {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
          </Badge>
        </div>
        <CardDescription>{goal.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Deadline</p>
              <div className="flex items-center">
                <Clock className="mr-1 h-3 w-3" />
                <p className="font-medium">
                  {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : "No deadline"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Stake</p>
              <p className="font-medium">{goal.stake_amount} ETH</p>
            </div>
          </div>

          {goal.status === "active" && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{calculateProgress(goal)}%</span>
              </div>
              <Progress value={calculateProgress(goal)} className="h-2" />
            </div>
          )}
        </div>
      </CardContent>
      {goal.status === "active" && !goal.evidence && (
        <CardFooter>
          <Button variant="outline" asChild className="w-full">
            <Link href={`/goals/${goal.id}`}>Submit Evidence</Link>
          </Button>
        </CardFooter>
      )}
      {goal.status === "active" && goal.evidence && (
        <CardFooter>
          <Button variant="outline" asChild className="w-full">
            <Link href={`/goals/${goal.id}`}>View Submission</Link>
          </Button>
        </CardFooter>
      )}
      {(goal.status === "completed" || goal.status === "failed") && (
        <CardFooter>
          <Button variant="outline" asChild className="w-full">
            <Link href={`/goals/${goal.id}`}>View Details</Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="icon" asChild className="mr-4">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Your Goals</h1>
          <Button asChild className="ml-auto">
            <Link href="/create">
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Link>
          </Button>
        </div>

        {!user && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication required</AlertTitle>
            <AlertDescription>Please sign in to view your goals.</AlertDescription>
          </Alert>
        )}

        {!walletAddress && (
          <Alert variant="warning" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Wallet not connected</AlertTitle>
            <AlertDescription>Please connect your wallet to create and manage goals.</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="active">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="active">Active ({activeGoals.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedGoals.length})</TabsTrigger>
            <TabsTrigger value="failed">Failed ({failedGoals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-[200px] w-full" />
              </div>
            ) : activeGoals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No active goals found</p>
                <Button asChild className="mt-4">
                  <Link href="/create">Create New Goal</Link>
                </Button>
              </div>
            ) : (
              activeGoals.map((goal) => <GoalCard key={goal.id} goal={goal} />)
            )}
          </TabsContent>

          <TabsContent value="completed">
            {loading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : completedGoals.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No completed goals</p>
            ) : (
              completedGoals.map((goal) => <GoalCard key={goal.id} goal={goal} />)
            )}
          </TabsContent>

          <TabsContent value="failed">
            {loading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : failedGoals.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No failed goals</p>
            ) : (
              failedGoals.map((goal) => <GoalCard key={goal.id} goal={goal} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

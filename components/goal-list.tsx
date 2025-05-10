"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/providers/auth-provider"
import { getGoalsByUser } from "@/lib/database"
import type { Goal } from "@/types/database"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

export function GoalList() {
  const [goals, setGoals] = useState<Goal[] | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please sign in to view your goals</p>
      </div>
    )
  }

  if (!goals || goals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No active goals found</p>
        <Button asChild className="mt-4">
          <Link href="/create">Create Your First Goal</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {goals.slice(0, 2).map((goal) => (
        <Link href={`/goals/${goal.id}`} key={goal.id}>
          <div className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">{goal.title}</h3>
              <Badge variant="outline" className={getStatusColor(goal.status)}>
                {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Deadline: {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : "No deadline"}
                </span>
                <span className="font-medium">{goal.stake_amount} ETH</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{calculateProgress(goal)}%</span>
                </div>
                <Progress value={calculateProgress(goal)} className="h-2" />
              </div>
            </div>
            <div className="flex justify-end">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Clock, User, MessageSquare, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/providers/auth-provider"
import { getGoalById, addComment, getComments, updateGoalStatus, updateGoalEvidence } from "@/lib/database"
import { verifyGoalCompletion, rejectGoalCompletion } from "@/lib/contract-interactions"
import type { Goal, Comment } from "@/types/database"
import Link from "next/link"

export default function GoalPage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState("")
  const [evidenceText, setEvidenceText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    const fetchGoalData = async () => {
      try {
        const goalData = await getGoalById(id as string)
        setGoal(goalData)

        const commentsData = await getComments(id as string)
        setComments(commentsData)
      } catch (error) {
        console.error("Error fetching goal:", error)
        toast({
          title: "Error fetching goal",
          description: "Could not load the goal details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchGoalData()
  }, [id, toast])

  const handleAddComment = async () => {
    if (!user || !commentText.trim()) return

    setIsSubmitting(true)

    try {
      const newComment = await addComment({
        goal_id: id as string,
        user_id: user.id,
        content: commentText,
      })

      // Optimistically update UI
      setComments([...comments, { ...newComment, user: { id: user.id, username: user.email?.split("@")[0] } as any }])
      setCommentText("")

      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      })
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "Error adding comment",
        description: "Could not add your comment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitEvidence = async () => {
    if (!user || !evidenceText.trim() || !goal) return

    setIsSubmitting(true)

    try {
      const updatedGoal = await updateGoalEvidence(id as string, evidenceText)

      // Update goal in state
      setGoal({ ...goal, evidence: evidenceText })
      setEvidenceText("")

      toast({
        title: "Evidence submitted",
        description: "Your evidence has been submitted for review",
      })
    } catch (error) {
      console.error("Error submitting evidence:", error)
      toast({
        title: "Error submitting evidence",
        description: "Could not submit your evidence",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyGoal = async () => {
    if (!user || !goal || !goal.contract_goal_id) return

    setIsVerifying(true)

    try {
      // First update on blockchain
      await verifyGoalCompletion(goal.contract_goal_id)

      // Then update in database
      const updatedGoal = await updateGoalStatus(id as string, "completed")

      // Update goal in state
      setGoal({ ...goal, status: "completed" })

      toast({
        title: "Goal verified",
        description: "The goal has been marked as completed and funds released",
      })
    } catch (error) {
      console.error("Error verifying goal:", error)
      toast({
        title: "Error verifying goal",
        description: "Could not verify the goal",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleRejectGoal = async () => {
    if (!user || !goal || !goal.contract_goal_id) return

    setIsVerifying(true)

    try {
      // First update on blockchain
      await rejectGoalCompletion(goal.contract_goal_id)

      // Then update in database
      const updatedGoal = await updateGoalStatus(id as string, "failed")

      // Update goal in state
      setGoal({ ...goal, status: "failed" })

      toast({
        title: "Goal rejected",
        description: "The goal has been marked as failed",
      })
    } catch (error) {
      console.error("Error rejecting goal:", error)
      toast({
        title: "Error rejecting goal",
        description: "Could not reject the goal",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

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

  const isReferee = user && goal && user.id === goal.referee_id
  const isCreator = user && goal && user.id === goal.creator_id
  const canSubmitEvidence = isCreator && goal && goal.status === "active"
  const canVerify = isReferee && goal && goal.status === "active" && goal.evidence

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold">Goal not found</h1>
          <p className="text-muted-foreground mt-2">
            The goal you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button asChild className="mt-4">
            <Link href="/goals">Back to Goals</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="icon" asChild className="mr-4">
            <Link href="/goals">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{goal.title}</h1>
          <Badge className={`ml-auto ${getStatusColor(goal.status)}`}>
            {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
          </Badge>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium">Description</h2>
                <p className="mt-2 text-muted-foreground">{goal.description || "No description provided."}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{new Date(goal.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Deadline</p>
                    <p className="font-medium">
                      {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : "No deadline"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Stake</p>
                    <p className="font-medium">{goal.stake_amount} ETH</p>
                  </div>
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

              {goal.evidence && (
                <div>
                  <h2 className="text-lg font-medium">Evidence</h2>
                  <div className="mt-2 p-4 bg-muted rounded-md">
                    <p>{goal.evidence}</p>
                  </div>
                </div>
              )}

              {canSubmitEvidence && (
                <div className="space-y-2">
                  <h2 className="text-lg font-medium">Submit Evidence</h2>
                  <Textarea
                    placeholder="Provide evidence of goal completion..."
                    value={evidenceText}
                    onChange={(e) => setEvidenceText(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={handleSubmitEvidence} disabled={isSubmitting || !evidenceText.trim()}>
                    {isSubmitting ? "Submitting..." : "Submit Evidence"}
                  </Button>
                </div>
              )}

              {canVerify && (
                <div className="flex space-x-4">
                  <Button className="flex-1" onClick={handleVerifyGoal} disabled={isVerifying}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {isVerifying ? "Verifying..." : "Verify Completion"}
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleRejectGoal} disabled={isVerifying}>
                    <XCircle className="mr-2 h-4 w-4" />
                    {isVerifying ? "Rejecting..." : "Reject Goal"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Comments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-4">
                    <Avatar>
                      <AvatarFallback>{comment.user?.username?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <p className="font-medium">{comment.user?.username || "Anonymous"}</p>
                        <span className="text-xs text-muted-foreground ml-2">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p>{comment.content}</p>
                    </div>
                  </div>
                ))
              )}

              {user && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={handleAddComment} disabled={isSubmitting || !commentText.trim()}>
                      {isSubmitting ? "Posting..." : "Post Comment"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

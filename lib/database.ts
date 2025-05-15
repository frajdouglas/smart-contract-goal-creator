import { supabaseClient } from "./supabase/client"
import { supabaseServer } from "./supabase/server"
import type { Goal, ProgressUpdate, Comment, UserProfile } from "@/types/database"

// User related functions
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabaseClient.from("users").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching user profile:", error)
    return null
  }

  return data
}

export async function updateUserProfile(userId: string, profile: Partial<UserProfile>) {
  const { data, error } = await supabaseServer.from("users").update(profile).eq("id", userId)

  if (error) {
    console.error("Error updating user profile:", error)
    throw error
  }

  return data
}

// Goal related functions
export async function createGoal(goal: Omit<Goal, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabaseServer.from("goals").insert(goal).select().single()

  if (error) {
    console.error("Error creating goal:", error)
    throw error
  }

  return data
}

export async function getGoalsByUser(userId: string) {
  const { data, error } = await supabaseClient
    .from("goals")
    .select("*")
    .eq("creator_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching goals:", error)
    return []
  }

  return data
}

export async function getGoalsByReferee(userId: string) {
  const { data, error } = await supabase.Client
    .from("goals")
    .select("*")
    .eq("referee_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching referee goals:", error)
    return []
  }

  return data
}

export async function getGoalById(goalId: string) {
  const { data, error } = await supabase.Client
    .from("goals")
    .select(`
      *,
      creator:creator_id(id, username, avatar_url, wallet_address),
      referee:referee_id(id, username, avatar_url, wallet_address)
    `)
    .eq("id", goalId)
    .single()

  if (error) {
    console.error("Error fetching goal:", error)
    return null
  }

  return data
}

export async function updateGoalStatus(goalId: string, status: string) {
  const { data, error } = await supabaseServer.from("goals").update({ status }).eq("id", goalId).select().single()

  if (error) {
    console.error("Error updating goal status:", error)
    throw error
  }

  return data
}

export async function updateGoalEvidence(goalId: string, evidence: string) {
  const { data, error } = await supabaseServer.from("goals").update({ evidence }).eq("id", goalId).select().single()

  if (error) {
    console.error("Error updating goal evidence:", error)
    throw error
  }

  return data
}

// Progress updates
export async function addProgressUpdate(update: Omit<ProgressUpdate, "id" | "created_at">) {
  const { data, error } = await supabaseServer.from("progress_updates").insert(update).select().single()

  if (error) {
    console.error("Error adding progress update:", error)
    throw error
  }

  return data
}

export async function getProgressUpdates(goalId: string) {
  const { data, error } = await supabaseClient
    .from("progress_updates")
    .select(`
      *,
      user:user_id(id, username, avatar_url)
    `)
    .eq("goal_id", goalId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching progress updates:", error)
    return []
  }

  return data
}

// Comments
export async function addComment(comment: Omit<Comment, "id" | "created_at">) {
  const { data, error } = await supabase.from("comments").insert(comment).select().single()

  if (error) {
    console.error("Error adding comment:", error)
    throw error
  }

  return data
}

export async function getComments(goalId: string) {
  const { data, error } = await supabaseClient
    .from("comments")
    .select(`
      *,
      user:user_id(id, username, avatar_url)
    `)
    .eq("goal_id", goalId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching comments:", error)
    return []
  }

  return data
}

// // Server-side functions - modified for Pages Router compatibility
// export async function getServerGoals() {
//   const supabase = createServerClient()

//   const { data, error } = await supabase
//     .from("goals")
//     .select(`
//       *,
//       creator:creator_id(id, username, avatar_url),
//       referee:referee_id(id, username, avatar_url)
//     `)
//     .order("created_at", { ascending: false })
//     .limit(10)

//   if (error) {
//     console.error("Error fetching goals:", error)
//     return []
//   }

//   return data
// }

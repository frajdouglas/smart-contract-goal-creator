export interface UserProfile {
  id: string
  wallet_address: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  title: string
  description: string | null
  contract_goal_id: string | null
  creator_id: string
  referee_id: string | null
  deadline: string | null
  stake_amount: string | null
  status: "active" | "completed" | "failed"
  evidence: string | null
  created_at: string
  updated_at: string
  // Join fields
  creator?: UserProfile
  referee?: UserProfile
}

export interface ProgressUpdate {
  id: string
  goal_id: string
  user_id: string
  content: string
  progress_percentage: number | null
  created_at: string
  // Join fields
  user?: UserProfile
}

export interface Comment {
  id: string
  goal_id: string
  user_id: string
  content: string
  created_at: string
  // Join fields
  user?: UserProfile
}

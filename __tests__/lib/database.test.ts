import {
  getUserProfile,
  updateUserProfile,
  createGoal,
  getGoalsByUser,
  getGoalById,
  updateGoalStatus,
  addComment,
  getComments,
} from "@/lib/database"
import { supabase } from "@/lib/supabase/client"
import { mockGoal, mockGoals, mockComments } from "../utils/test-utils"

// Mock Supabase client
jest.mock("@/lib/supabase/client")

describe("Database Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementation for Supabase queries
    ;(supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })
  })

  describe("User Profile Functions", () => {
    it("getUserProfile fetches a user profile", async () => {
      const mockProfile = {
        id: "test-id",
        username: "testuser",
        wallet_address: "0x1234567890123456789012345678901234567890",
        bio: "Test bio",
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
      })

      const result = await getUserProfile("test-id")

      expect(supabase.from).toHaveBeenCalledWith("users")
      expect(result).toEqual(mockProfile)
    })

    it("updateUserProfile updates a user profile", async () => {
      const mockProfile = {
        username: "newusername",
        bio: "New bio",
      }
      ;(supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { ...mockProfile, id: "test-id" }, error: null }),
      })

      const result = await updateUserProfile("test-id", mockProfile)

      expect(supabase.from).toHaveBeenCalledWith("users")
      expect(result).toEqual({ ...mockProfile, id: "test-id" })
    })
  })

  describe("Goal Functions", () => {
    it("createGoal creates a new goal", async () => {
      const newGoal = {
        title: "New Goal",
        description: "New goal description",
        creator_id: "test-id",
        referee_id: "referee-id",
        deadline: new Date().toISOString(),
        stake_amount: "0.5",
        status: "active",
      }
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { ...newGoal, id: "new-goal-id" }, error: null }),
      })

      const result = await createGoal(newGoal)

      expect(supabase.from).toHaveBeenCalledWith("goals")
      expect(result).toEqual({ ...newGoal, id: "new-goal-id" })
    })

    it("getGoalsByUser fetches goals for a user", async () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockGoals, error: null }),
      })

      const result = await getGoalsByUser("test-id")

      expect(supabase.from).toHaveBeenCalledWith("goals")
      expect(result).toEqual(mockGoals)
    })

    it("getGoalById fetches a single goal with creator and referee", async () => {
      const goalWithRelations = {
        ...mockGoal,
        creator: {
          id: "test-id",
          username: "creator",
          avatar_url: null,
          wallet_address: "0x1234567890123456789012345678901234567890",
        },
        referee: {
          id: "referee-id",
          username: "referee",
          avatar_url: null,
          wallet_address: "0x0987654321098765432109876543210987654321",
        },
      }
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: goalWithRelations, error: null }),
      })

      const result = await getGoalById("test-goal-id")

      expect(supabase.from).toHaveBeenCalledWith("goals")
      expect(result).toEqual(goalWithRelations)
    })

    it("updateGoalStatus updates a goal status", async () => {
      const updatedGoal = {
        ...mockGoal,
        status: "completed",
      }
      ;(supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: updatedGoal, error: null }),
      })

      const result = await updateGoalStatus("test-goal-id", "completed")

      expect(supabase.from).toHaveBeenCalledWith("goals")
      expect(result).toEqual(updatedGoal)
    })
  })

  describe("Comment Functions", () => {
    it("addComment adds a new comment", async () => {
      const newComment = {
        goal_id: "test-goal-id",
        user_id: "test-id",
        content: "Test comment",
      }
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { ...newComment, id: "new-comment-id" }, error: null }),
      })

      const result = await addComment(newComment)

      expect(supabase.from).toHaveBeenCalledWith("comments")
      expect(result).toEqual({ ...newComment, id: "new-comment-id" })
    })

    it("getComments fetches comments for a goal", async () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockComments, error: null }),
      })

      const result = await getComments("test-goal-id")

      expect(supabase.from).toHaveBeenCalledWith("comments")
      expect(result).toEqual(mockComments)
    })
  })
})

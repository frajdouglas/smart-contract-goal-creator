import { render, screen, waitFor } from "../utils/test-utils"
import { GoalList } from "@/components/goal-list"
import { useAuth } from "@/components/providers/auth-provider"
import { getGoalsByUser } from "@/lib/database"
import { mockGoals } from "../utils/test-utils"

// Mock the hooks and functions
jest.mock("@/components/providers/auth-provider")
jest.mock("@/lib/database")

describe("GoalList Component", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementation
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      walletAddress: null,
    })
    ;(getGoalsByUser as jest.Mock).mockResolvedValue([])
  })

  it("renders message when user is not signed in", async () => {
    render(<GoalList />)

    await waitFor(() => {
      expect(screen.getByText("Please sign in to view your goals")).toBeInTheDocument()
    })
  })

  it("renders loading state initially", () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: "test-id" },
      walletAddress: "0x1234567890123456789012345678901234567890",
    })

    render(<GoalList />)

    // Check for skeleton loaders
    const skeletons = document.querySelectorAll(".skeleton")
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("renders message when user has no goals", async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: "test-id" },
      walletAddress: "0x1234567890123456789012345678901234567890",
    })
    ;(getGoalsByUser as jest.Mock).mockResolvedValue([])

    render(<GoalList />)

    await waitFor(() => {
      expect(screen.getByText("No active goals found")).toBeInTheDocument()
      expect(screen.getByText("Create Your First Goal")).toBeInTheDocument()
    })
  })

  it("renders goals when user has goals", async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: "test-id" },
      walletAddress: "0x1234567890123456789012345678901234567890",
    })

    // Only return active goals for this test
    const activeGoals = mockGoals.filter((goal) => goal.status === "active")
    ;(getGoalsByUser as jest.Mock).mockResolvedValue(activeGoals)

    render(<GoalList />)

    await waitFor(() => {
      expect(screen.getByText("Test Goal")).toBeInTheDocument()
      expect(screen.getByText("0.5 ETH")).toBeInTheDocument()
      expect(screen.getByText("Progress")).toBeInTheDocument()
    })
  })

  it("calculates progress correctly based on deadline", async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: "test-id" },
      walletAddress: "0x1234567890123456789012345678901234567890",
    })

    // Create a goal with a deadline that's 50% of the way from creation to deadline
    const now = new Date()
    const createdDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    const deadlineDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) // 5 days from now

    const goalWithProgress = {
      ...mockGoals[0],
      created_at: createdDate.toISOString(),
      deadline: deadlineDate.toISOString(),
    }
    ;(getGoalsByUser as jest.Mock).mockResolvedValue([goalWithProgress])

    render(<GoalList />)

    await waitFor(() => {
      // Progress should be around 50% (might not be exact due to time passing during test)
      const progressElement = screen.getByText(/\d+%/)
      const progressValue = Number.parseInt(progressElement.textContent || "0")
      expect(progressValue).toBeGreaterThanOrEqual(45)
      expect(progressValue).toBeLessThanOrEqual(55)
    })
  })
})

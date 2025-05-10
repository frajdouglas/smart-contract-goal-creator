import { render, screen, fireEvent, waitFor } from "../utils/test-utils"
import CreateGoalPage from "@/app/create/page"
import { useAuth } from "@/components/providers/auth-provider"
import { createGoal } from "@/lib/database"
import { createGoalOnChain } from "@/lib/contract-interactions"
import { useRouter } from "next/navigation"

// Mock the hooks and functions
jest.mock("@/components/providers/auth-provider")
jest.mock("@/lib/database")
jest.mock("@/lib/contract-interactions")
jest.mock("next/navigation")

describe("CreateGoal Page", () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementation
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: "test-id" },
      walletAddress: "0x1234567890123456789012345678901234567890",
    })
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(createGoalOnChain as jest.Mock).mockResolvedValue({ hash: "test-tx-hash" })
    ;(createGoal as jest.Mock).mockResolvedValue({ id: "test-goal-id" })
  })

  it("renders authentication warning when user is not signed in", () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      walletAddress: null,
    })

    render(<CreateGoalPage />)

    expect(screen.getByText("Authentication required")).toBeInTheDocument()
    expect(screen.getByText("Please connect your wallet and sign in to create a goal.")).toBeInTheDocument()
  })

  it("renders the create goal form when user is signed in", () => {
    render(<CreateGoalPage />)

    expect(screen.getByText("Create New Goal")).toBeInTheDocument()
    expect(screen.getByLabelText("Goal Title")).toBeInTheDocument()
    expect(screen.getByLabelText("Description")).toBeInTheDocument()
    expect(screen.getByLabelText("Stake Amount (ETH)")).toBeInTheDocument()
    expect(screen.getByLabelText("Referee Wallet Address")).toBeInTheDocument()
  })

  it("submits the form and creates a goal", async () => {
    render(<CreateGoalPage />)

    // Fill out the form
    fireEvent.change(screen.getByLabelText("Goal Title"), {
      target: { value: "Test Goal" },
    })

    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "This is a test goal" },
    })

    fireEvent.change(screen.getByLabelText("Stake Amount (ETH)"), {
      target: { value: "0.5" },
    })

    fireEvent.change(screen.getByLabelText("Referee Wallet Address"), {
      target: { value: "0x0987654321098765432109876543210987654321" },
    })

    // Submit the form
    fireEvent.click(screen.getByText("Create & Stake ETH"))

    // Check that the contract and database functions were called
    await waitFor(() => {
      expect(createGoalOnChain).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test Goal",
          description: "This is a test goal",
          stake: "0.5",
          refereeAddress: "0x0987654321098765432109876543210987654321",
        }),
      )

      expect(createGoal).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test Goal",
          description: "This is a test goal",
          stake_amount: "0.5",
          creator_id: "test-id",
          status: "active",
          contract_goal_id: "test-tx-hash",
        }),
      )

      // Check that we navigate to the goal page
      expect(mockPush).toHaveBeenCalledWith("/goals/test-goal-id")
    })
  })

  it("handles form validation", async () => {
    render(<CreateGoalPage />)

    // Submit without filling out required fields
    fireEvent.click(screen.getByText("Create & Stake ETH"))

    // Check that validation prevents submission
    await waitFor(() => {
      expect(createGoalOnChain).not.toHaveBeenCalled()
      expect(createGoal).not.toHaveBeenCalled()
    })
  })
})

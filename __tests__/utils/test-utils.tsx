import type React from "react"
import type { ReactElement } from "react"
import { render, type RenderOptions } from "@testing-library/react"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/providers/auth-provider"

// Create a custom render function that includes providers
const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  )
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: AllProviders, ...options })

// Re-export everything from testing-library
export * from "@testing-library/react"

// Override the render method
export { customRender as render }

// Mock data
export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  user_metadata: {
    wallet_address: "0x1234567890123456789012345678901234567890",
  },
}

export const mockGoal = {
  id: "test-goal-id",
  title: "Test Goal",
  description: "This is a test goal",
  deadline: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  stake_amount: "0.5",
  status: "active",
  creator_id: "test-user-id",
  referee_id: "test-referee-id",
  evidence: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  success_destination: "creator",
  failure_destination: "referee",
  charity_address: null,
}

export const mockGoals = [
  mockGoal,
  {
    ...mockGoal,
    id: "test-goal-id-2",
    title: "Completed Goal",
    status: "completed",
  },
  {
    ...mockGoal,
    id: "test-goal-id-3",
    title: "Failed Goal",
    status: "failed",
  },
]

export const mockComments = [
  {
    id: "test-comment-id",
    goal_id: "test-goal-id",
    user_id: "test-user-id",
    content: "This is a test comment",
    created_at: new Date().toISOString(),
    user: {
      id: "test-user-id",
      username: "testuser",
      avatar_url: null,
    },
  },
]

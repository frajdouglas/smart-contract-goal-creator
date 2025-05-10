"use client"

import { render, act, waitFor } from "../../utils/test-utils"
import { AuthProvider, useAuth } from "@/components/providers/auth-provider"
import { supabase } from "@/lib/supabase/client"

// Mock the Supabase client
jest.mock("@/lib/supabase/client")

// Create a test component that uses the auth context
const TestComponent = () => {
  const auth = useAuth()
  return (
    <div>
      <div data-testid="user">{JSON.stringify(auth.user)}</div>
      <div data-testid="wallet">{auth.walletAddress}</div>
      <button onClick={() => auth.connectWallet()}>Connect</button>
      <button onClick={() => auth.signIn()}>Sign In</button>
      <button onClick={() => auth.signOut()}>Sign Out</button>
    </div>
  )
}

describe("AuthProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock Supabase auth methods
    ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    })
    ;(supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })

    // Mock window.ethereum
    if (global.window.ethereum) {
      global.window.ethereum.request.mockImplementation((params) => {
        if (params.method === "eth_accounts") {
          return Promise.resolve([])
        }
        if (params.method === "eth_requestAccounts") {
          return Promise.resolve(["0x1234567890123456789012345678901234567890"])
        }
        return Promise.reject(new Error("Method not implemented"))
      })
    }
  })

  it("initializes with null user and wallet", async () => {
    let container

    await act(async () => {
      container = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      ).container
    })

    await waitFor(() => {
      expect(container.querySelector('[data-testid="user"]')).toHaveTextContent("null")
      expect(container.querySelector('[data-testid="wallet"]')).toHaveTextContent("")
    })
  })

  it("checks for existing wallet connection on mount", async () => {
    // Mock existing wallet connection
    if (global.window.ethereum) {
      global.window.ethereum.request.mockImplementation((params) => {
        if (params.method === "eth_accounts") {
          return Promise.resolve(["0x1234567890123456789012345678901234567890"])
        }
        return Promise.reject(new Error("Method not implemented"))
      })
    }

    let container

    await act(async () => {
      container = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      ).container
    })

    await waitFor(() => {
      expect(container.querySelector('[data-testid="wallet"]')).toHaveTextContent(
        "0x1234567890123456789012345678901234567890",
      )
    })
  })

  it("connects wallet when connectWallet is called", async () => {
    const { getByText, getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )

    await act(async () => {
      getByText("Connect").click()
    })

    await waitFor(() => {
      expect(getByTestId("wallet")).toHaveTextContent("0x1234567890123456789012345678901234567890")
    })
  })

  it("signs in user when signIn is called", async () => {
    // Mock successful sign in
    ;(supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })
    ;(supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: {
        user: { id: "test-id", email: "test@example.com" },
        session: { user: { id: "test-id", email: "test@example.com" } },
      },
      error: null,
    })

    const { getByText, getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )

    // First connect wallet
    await act(async () => {
      getByText("Connect").click()
    })

    // Then sign in
    await act(async () => {
      getByText("Sign In").click()
    })

    // Mock auth state change
    await act(async () => {
      const authStateChangeCallback = (supabase.auth.onAuthStateChange as jest.Mock).mock.calls[0][1]
      authStateChangeCallback("SIGNED_IN", {
        user: { id: "test-id", email: "test@example.com" },
      })
    })

    await waitFor(() => {
      expect(getByTestId("user")).not.toHaveTextContent("null")
      expect(JSON.parse(getByTestId("user").textContent || "{}")).toHaveProperty("id", "test-id")
    })
  })

  it("signs out user when signOut is called", async () => {
    // Mock signed in user
    ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: {
        session: {
          user: { id: "test-id", email: "test@example.com" },
        },
      },
      error: null,
    })

    const { getByText, getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )

    // Wait for user to be set
    await waitFor(() => {
      expect(getByTestId("user")).not.toHaveTextContent("null")
    })

    // Sign out
    await act(async () => {
      getByText("Sign Out").click()
    })

    // Mock auth state change
    await act(async () => {
      const authStateChangeCallback = (supabase.auth.onAuthStateChange as jest.Mock).mock.calls[0][1]
      authStateChangeCallback("SIGNED_OUT", null)
    })

    await waitFor(() => {
      expect(getByTestId("user")).toHaveTextContent("null")
    })
  })
})

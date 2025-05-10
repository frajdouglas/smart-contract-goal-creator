import { render, screen, fireEvent, waitFor } from "../utils/test-utils"
import { ConnectWallet } from "@/components/connect-wallet"
import { useAuth } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"

// Mock the hooks
jest.mock("@/components/providers/auth-provider")
jest.mock("@/hooks/use-toast")

describe("ConnectWallet Component", () => {
  const mockConnectWallet = jest.fn()
  const mockSignIn = jest.fn()
  const mockSignOut = jest.fn()
  const mockDisconnectWallet = jest.fn()
  const mockToast = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementation
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      walletAddress: null,
      connectWallet: mockConnectWallet,
      signIn: mockSignIn,
      signOut: mockSignOut,
      disconnectWallet: mockDisconnectWallet,
    })
    ;(useToast as jest.Mock).mockReturnValue({
      toast: mockToast,
    })
  })

  it("renders connect wallet button when not connected", () => {
    render(<ConnectWallet />)

    expect(screen.getByText("Connect Wallet")).toBeInTheDocument()
    expect(screen.queryByText("Sign In with Wallet")).not.toBeInTheDocument()
  })

  it("renders sign in button when wallet is connected but user is not signed in", () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      walletAddress: "0x1234567890123456789012345678901234567890",
      connectWallet: mockConnectWallet,
      signIn: mockSignIn,
      signOut: mockSignOut,
      disconnectWallet: mockDisconnectWallet,
    })

    render(<ConnectWallet />)

    expect(screen.getByText("Sign In with Wallet")).toBeInTheDocument()
    expect(screen.getByText("Connected:")).toBeInTheDocument()
    expect(screen.getByText("Disconnect")).toBeInTheDocument()
  })

  it("renders user info when signed in", () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: "test-id", email: "test@example.com" },
      walletAddress: "0x1234567890123456789012345678901234567890",
      connectWallet: mockConnectWallet,
      signIn: mockSignIn,
      signOut: mockSignOut,
      disconnectWallet: mockDisconnectWallet,
    })

    render(<ConnectWallet />)

    expect(screen.getByText("Wallet Connected")).toBeInTheDocument()
    expect(screen.getByText("Sign Out")).toBeInTheDocument()
  })

  it("calls connectWallet when connect button is clicked", async () => {
    render(<ConnectWallet />)

    fireEvent.click(screen.getByText("Connect Wallet"))

    expect(mockConnectWallet).toHaveBeenCalled()

    // Wait for the toast to be called after successful connection
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Wallet connected",
        description: "Your wallet has been connected successfully.",
      })
    })
  })

  it("calls signIn when sign in button is clicked", async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      walletAddress: "0x1234567890123456789012345678901234567890",
      connectWallet: mockConnectWallet,
      signIn: mockSignIn,
      signOut: mockSignOut,
      disconnectWallet: mockDisconnectWallet,
    })

    render(<ConnectWallet />)

    fireEvent.click(screen.getByText("Sign In with Wallet"))

    expect(mockSignIn).toHaveBeenCalled()

    // Wait for the toast to be called after successful sign in
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Signed in successfully",
        description: "You are now signed in to the application.",
      })
    })
  })

  it("calls signOut when sign out button is clicked", async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: "test-id", email: "test@example.com" },
      walletAddress: "0x1234567890123456789012345678901234567890",
      connectWallet: mockConnectWallet,
      signIn: mockSignIn,
      signOut: mockSignOut,
      disconnectWallet: mockDisconnectWallet,
    })

    render(<ConnectWallet />)

    fireEvent.click(screen.getByText("Sign Out"))

    expect(mockSignOut).toHaveBeenCalled()

    // Wait for the toast to be called after successful sign out
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Signed out",
        description: "You have been signed out successfully.",
      })
    })
  })
})

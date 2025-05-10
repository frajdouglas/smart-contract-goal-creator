// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom"
import { jest } from "@jest/globals"

// Mock the window.ethereum object
global.window = Object.create(window)
Object.defineProperty(window, "ethereum", {
  value: {
    isMetaMask: true,
    request: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
  },
})

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useParams: () => ({
    id: "test-id",
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}))

// Mock Supabase
jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    }),
  },
}))

// Mock ethers
jest.mock("ethers", () => ({
  BrowserProvider: jest.fn().mockImplementation(() => ({
    getSigner: jest.fn().mockResolvedValue({
      signMessage: jest.fn().mockResolvedValue("0xmocksignature"),
    }),
  })),
  Contract: jest.fn(),
  parseEther: jest.fn().mockReturnValue("1000000000000000000"),
}))

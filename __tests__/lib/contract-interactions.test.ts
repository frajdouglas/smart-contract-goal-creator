import { createGoalOnChain, verifyGoalCompletion, rejectGoalCompletion } from "@/lib/contract-interactions"
import { ethers } from "ethers"

// Mock ethers
jest.mock("ethers")

describe("Contract Interactions", () => {
  let mockSigner
  let mockContract
  let mockProvider
  let mockTx

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock transaction
    mockTx = {
      hash: "test-tx-hash",
      wait: jest.fn().mockResolvedValue({}),
    }

    // Mock contract
    mockContract = {
      createGoal: jest.fn().mockResolvedValue(mockTx),
      verifyGoalCompletion: jest.fn().mockResolvedValue(mockTx),
      rejectGoalCompletion: jest.fn().mockResolvedValue(mockTx),
    }

    // Mock signer
    mockSigner = {
      getAddress: jest.fn().mockResolvedValue("0x1234567890123456789012345678901234567890"),
    }

    // Mock provider
    mockProvider = {
      getSigner: jest.fn().mockResolvedValue(mockSigner),
    }

    // Mock ethers
    ;(ethers.BrowserProvider as jest.Mock).mockImplementation(() => mockProvider)
    ;(ethers.Contract as jest.Mock).mockImplementation(() => mockContract)
    ;(ethers.parseEther as jest.Mock).mockImplementation((value) => `${value}000000000000000000`)

    // Mock window.ethereum
    if (global.window.ethereum) {
      global.window.ethereum.request.mockResolvedValue(["0x1234567890123456789012345678901234567890"])
    }
  })

  describe("createGoalOnChain", () => {
    it("creates a goal on the blockchain", async () => {
      const goalData = {
        title: "Test Goal",
        description: "Test description",
        deadline: new Date(Date.now() + 86400000), // Tomorrow
        stake: "0.5",
        refereeAddress: "0x0987654321098765432109876543210987654321",
      }

      const result = await createGoalOnChain(goalData)

      expect(ethers.BrowserProvider).toHaveBeenCalledWith(window.ethereum)
      expect(ethers.Contract).toHaveBeenCalled()
      expect(ethers.parseEther).toHaveBeenCalledWith("0.5")
      expect(mockContract.createGoal).toHaveBeenCalledWith(
        "Test Goal",
        "Test description",
        expect.any(Number),
        "0x0987654321098765432109876543210987654321",
        { value: "0.5000000000000000000" },
      )
      expect(result).toEqual(mockTx)
    })

    it("throws an error if MetaMask is not installed", async () => {
      // Temporarily remove window.ethereum
      const originalEthereum = global.window.ethereum
      delete global.window.ethereum

      const goalData = {
        title: "Test Goal",
        description: "Test description",
        deadline: new Date(),
        stake: "0.5",
        refereeAddress: "0x0987654321098765432109876543210987654321",
      }

      await expect(createGoalOnChain(goalData)).rejects.toThrow("MetaMask is not installed")

      // Restore window.ethereum
      global.window.ethereum = originalEthereum
    })
  })

  describe("verifyGoalCompletion", () => {
    it("verifies a goal completion on the blockchain", async () => {
      const result = await verifyGoalCompletion("test-goal-id")

      expect(ethers.BrowserProvider).toHaveBeenCalledWith(window.ethereum)
      expect(ethers.Contract).toHaveBeenCalled()
      expect(mockContract.verifyGoalCompletion).toHaveBeenCalledWith("test-goal-id")
      expect(result).toEqual(mockTx)
    })
  })

  describe("rejectGoalCompletion", () => {
    it("rejects a goal completion on the blockchain", async () => {
      const result = await rejectGoalCompletion("test-goal-id")

      expect(ethers.BrowserProvider).toHaveBeenCalledWith(window.ethereum)
      expect(ethers.Contract).toHaveBeenCalled()
      expect(mockContract.rejectGoalCompletion).toHaveBeenCalledWith("test-goal-id")
      expect(result).toEqual(mockTx)
    })
  })
})

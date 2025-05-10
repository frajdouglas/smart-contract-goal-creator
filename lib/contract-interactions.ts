"use client"

import { ethers } from "ethers"

// This would be the actual contract ABI and address in a real application
const CONTRACT_ABI = [
  // Example ABI for the escrow contract
  "function createGoal(string title, string description, uint256 deadline, address referee) payable",
  "function verifyGoalCompletion(uint256 goalId) external",
  "function rejectGoalCompletion(uint256 goalId) external",
  "function getGoals() external view returns (Goal[] memory)",
  "function getGoalsByReferee(address referee) external view returns (Goal[] memory)",
]
const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890" // Example address

// Get provider and signer
const getProviderAndSigner = async () => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed")
  }

  await window.ethereum.request({ method: "eth_requestAccounts" })
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  return { provider, signer }
}

// Create a new goal on the blockchain
export const createGoalOnChain = async (goalData: any) => {
  try {
    const { signer } = await getProviderAndSigner()

    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

    // Convert deadline to Unix timestamp
    const deadlineTimestamp = Math.floor(goalData.deadline.getTime() / 1000)

    // Convert ETH to Wei
    const stakeAmount = ethers.parseEther(goalData.stake)

    // Call the contract function
    const tx = await contract.createGoal(
      goalData.title,
      goalData.description,
      deadlineTimestamp,
      goalData.refereeAddress,
      { value: stakeAmount },
    )

    // Wait for transaction to be mined
    await tx.wait()

    return tx
  } catch (error) {
    console.error("Error creating goal:", error)
    throw error
  }
}

// Verify goal completion (referee function)
export const verifyGoalCompletion = async (contractGoalId: string) => {
  try {
    const { signer } = await getProviderAndSigner()
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

    const tx = await contract.verifyGoalCompletion(contractGoalId)
    await tx.wait()

    return tx
  } catch (error) {
    console.error("Error verifying goal:", error)
    throw error
  }
}

// Reject goal completion (referee function)
export const rejectGoalCompletion = async (contractGoalId: string) => {
  try {
    const { signer } = await getProviderAndSigner()
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

    const tx = await contract.rejectGoalCompletion(contractGoalId)
    await tx.wait()

    return tx
  } catch (error) {
    console.error("Error rejecting goal:", error)
    throw error
  }
}

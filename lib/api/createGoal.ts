import axios from "axios";

interface CreateGoalParams {
  title: string;
  description: string;
  expiry_date: string; // ISO string
  refereeAddress: string;
  successRecipientAddress: string;
  failureRecipientAddress: string;
  stakeAmount: string; // ETH amount as string
  contractGoalId: string; // The ID from the smart contract
  transactionHash: string; // The hash of the on-chain creation transaction
}

// Define the expected shape of the successful response from the API route
interface CreateGoalResponse {
  message: string;
  goal: {
    id: string; // The UUID from Supabase
    contract_goal_id: string;
    creator_address: string;
    referee_address: string;
    success_recipient_address: string;
    failure_recipient_address: string;
    escrow_amount: string;
    goal_hash?: string; // Optional, if you decide to store it
    created_at: string;
    expiry_date: string;
    status: number;
    description: string;
    title: string;
    transaction_hash: string;
  };
}

/**
 * Calls the Next.js API route to save goal details to the database.
 * This is typically called after a successful on-chain transaction.
 * @param goalData The data for the goal to be saved.
 * @returns A promise that resolves with the success message and the created goal object.
 * @throws An error if the API call fails.
 */
export async function createGoal(
  goalData: CreateGoalParams
): Promise<CreateGoalResponse> {
  try {
    const response = await axios.post<CreateGoalResponse>(
      "/api/goals/create", // The endpoint for your new API route
      goalData, // The request body containing all goal details
      {
        withCredentials: true, // Important for sending HttpOnly cookies (like authToken)
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error posting goal to backend:", error.response?.data || error.message);
    // Throw a more specific error message from the API response if available
    throw new Error(error.response?.data?.message || "Failed to save goal to database.");
  }
}

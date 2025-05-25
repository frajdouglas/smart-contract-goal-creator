import axios from "axios";

export interface FetchedGoal {
  id: string; // UUID
  contract_goal_id: string;
  creator_address: string; // Will be lowercase from DB
  referee_address: string; // Will be lowercase from DB
  success_recipient_address: string;
  failure_recipient_address: string;
  stake_amount: string;
  created_at: string;
  expiry_date: string;
  status: number;
  description: string;
  title: string;
  transaction_hash: string;
}

interface GetFailureRecipientGoalsResponse {
  message: string;
  goals: FetchedGoal[];
}

export async function getFailureRecipientGoals(): Promise<GetFailureRecipientGoalsResponse> {
  try {
    const response = await axios.get<GetFailureRecipientGoalsResponse>(
      "/api/goals/fetch", // The endpoint for your new GET all goals API route
      {
        withCredentials: true, // Important for sending HttpOnly cookies (like authToken)
        headers: {
          'Content-Type': 'application/json', // Not strictly necessary for GET, but good practice
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching failure recipient goals:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to fetch failure recipient goals.");
  }
}

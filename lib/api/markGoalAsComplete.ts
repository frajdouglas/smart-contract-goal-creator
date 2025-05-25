import axios from "axios";

interface CreateGoalResponse {
    message: string;
};

export async function markGoalAsComplete(contract_goal_id: number, transactionHash: string): Promise<CreateGoalResponse> {
    try {
        const response = await axios.post<{ contract_goal_id: number; transactionHash: string }>(
            "/api/referee/complete",
            { contract_goal_id, transactionHash },
            {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error: any) {
        console.error("Error updating status:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Failed to update status");
    }
}
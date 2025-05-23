import axios from "axios";

export async function validateAuthToken(): Promise<{ message: string, walletAddress: string }> {

    try {
        const response = await axios.get("/api/auth/validate", {
            withCredentials: true,
        });
        return response.data;
    } catch (error: any) {
        console.error("Error verifying auth token", error.response?.data || error.message);
        throw new Error(error.response?.data?.error || "Failed to verify auth token");
    }
}
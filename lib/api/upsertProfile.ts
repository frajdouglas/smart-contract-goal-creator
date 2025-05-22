import axios from "axios";

export interface Profile {
    id: string;
    wallet_address: string;
    created_at: string;
}
export async function upsertProfile(): Promise<{ message: string; profile: Profile }> {
    try {
        const response = await axios.post<{ message: string; profile: Profile }>(
            "/api/profile/upsert",
            {},
            {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error: any) {
        console.error("Error upserting profile:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Failed to upsert profile");
    }
}
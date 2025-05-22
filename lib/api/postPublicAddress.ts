import axios from "axios";

export async function postPublicAddress(address: string): Promise<{ nonce: string }> {
  if (!address) {
    throw new Error("Address is required");
  }

  try {
    const response = await axios.post("/api/auth/nonce", { address });
    return response.data;
  } catch (error: any) {
    console.error("Error posting nonce:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error || "Failed to post nonce");
  }
}
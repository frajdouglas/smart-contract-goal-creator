import axios from "axios";

export async function verifyNonce(address: string, nonce: string, signature: string): Promise<{ token: string }> {
  if (!address || !nonce || !signature) {
    throw new Error("Address, nonce, and signature are required");
  }

  try {
    const response = await axios.post("/api/auth/verify", { address, nonce, signature });
    return response.data; 
  } catch (error: any) {
    console.error("Error verifying nonce:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error || "Failed to verify nonce");
  }
}
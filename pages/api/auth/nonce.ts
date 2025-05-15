import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import { supabaseServer } from "@/lib/supabase/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ answer: "working" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { address } = req.body;

  if (!address || typeof address !== "string") {
    return res.status(400).json({ error: "Missing or invalid address" });
  }

  try {
    // Generate a unique nonce
    const nonce = uuidv4();

    // Calculate the expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    console.log(nonce, address, "nonce");

    // Insert the nonce into the nonces table with an expiration time
    const { error } = await supabaseServer
      .from("nonces")
      .insert([{ nonce, address, created_at: new Date().toISOString(), expires_at: expiresAt }]);

    if (error) {
      console.error("Error inserting nonce:", error);
      return res.status(500).json({ error: "Failed to store nonce" });
    }

    // Return the generated nonce and expiration time
    return res.status(200).json({ nonce, expires_at: expiresAt });
  } catch (err) {
    console.error("Error generating nonce:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
import { NextApiRequest, NextApiResponse } from "next";
import { supabaseClient } from "@/lib/supabase/client";
import { ethers } from "ethers";
import jwt from "jsonwebtoken";
import { serialize } from 'cookie';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { address, nonce, signature } = req.body;

  if (!address || !nonce || !signature) {
    return res.status(400).json({ error: "Missing address, nonce, or signature" });
  }

  try {
    // Query the nonces table for the provided nonce and address
    const { data: nonceRecord, error: queryError } = await supabaseClient
      .from("nonces")
      .select("*")
      .eq("nonce", nonce)
      .eq("address", address)
      .single();

    if (queryError || !nonceRecord) {
      return res.status(400).json({ error: "Invalid or expired nonce" });
    }

    // Check if the nonce is within the valid timeframe
    const nonceExpiryTime = new Date(nonceRecord.expires_at);
    const currentTime = new Date();

    if (currentTime > nonceExpiryTime) {
      return res.status(400).json({ error: "Nonce has expired" });
    }

    // Verify the signature using ethers.js
    const recoveredAddress = ethers.utils.verifyMessage(nonce, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Generate a JWT with the address as a claim
    const token = jwt.sign({ address }, process.env.JWT_SECRET!, { expiresIn: "1h" });


    // Set the JWT as an HTTP-only cookie
    res.setHeader('Set-Cookie', serialize('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Ensure secure in production
      sameSite: 'strict', // Or 'lax' depending on your needs
      path: '/', // Cookie available for the entire domain
      maxAge: 60 * 60, // 1 hour in seconds (matches JWT expiry)
    }));


    // Delete the used nonce from the database
    const { error: deleteError } = await supabaseClient
      .from("nonces")
      .delete()
      .eq("nonce", nonce)
      .eq("address", address);

    if (deleteError) {
      console.error("Error deleting nonce:", deleteError);
      return res.status(500).json({ error: "Failed to clean up nonce" });
    }

    // Return the generated JWT
    return res.status(200).json({ token });
  } catch (error) {
    console.error("Error verifying nonce:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
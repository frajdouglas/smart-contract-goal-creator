
import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { supabaseServer } from '@/lib/supabase/server'; // Assuming this is your server-side Supabase client

// IMPORTANT: Ensure your JWT_SECRET is correctly set in your environment variables.
// It should be the same secret used to sign the JWT during authentication.
const JWT_SECRET = process.env.JWT_SECRET!;

// Basic type for a goal returned from Supabase (adjust as per your actual table row)
interface Goal {
  id: string; // UUID
  contract_goal_id: string;
  creator_address: string;
  referee_address: string;
  success_recipient_address: string;
  failure_recipient_address: string;
  stake_amount: string; // Numeric in DB, but often handled as string in JS
  created_at: string; // TIMESTAMPTZ
  expiry_date: string; // TIMESTAMPTZ
  status: number; // SMALLINT
  description: string;
  title: string;
  transaction_hash: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure the request method is GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 1. Authenticate and Authorize User
  const authToken = req.cookies.authToken;

  if (!authToken) {
    return res.status(401).json({ message: 'Authentication required: No auth token found.' });
  }

  let userWalletAddress: string;
  try {
    const decodedToken = jwt.verify(authToken, JWT_SECRET) as jwt.JwtPayload;
    userWalletAddress = decodedToken.address as string; // Assuming 'address' is the key in your JWT payload

    if (!userWalletAddress) {
      throw new Error('Wallet address not found in authentication token payload.');
    }
  } catch (error: any) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }

  // Standardize the wallet address to lowercase for database consistency.
  const lowercasedUserWalletAddress = userWalletAddress.toLowerCase();

  // 2. Fetch Goals from Database
  try {
    // Query the 'goals' table, filtering by the authenticated user's wallet address
    const { data: goals, error } = await supabaseServer
      .from('goals')
      .select('*') // Select all columns
      .eq('referee_address', lowercasedUserWalletAddress) // Filter by the creator's address
      .order('created_at', { ascending: false }); // Order by creation date, newest first

    if (error) {
      console.error("Supabase fetch goals error:", error);
      throw new Error(`Failed to fetch goals from database: ${error.message}`);
    }

    // If no goals are found, return an empty array
    if (!goals) {
      return res.status(200).json({ message: 'No goals found for this referee.', goals: [] });
    }

    // 3. Return Success Response
    return res.status(200).json({ message: 'referee goals fetched successfully', goals: goals as Goal[] });

  } catch (dbError: any) {
    console.error('An unexpected error occurred during goal fetching:', dbError.message);
    return res.status(500).json({ message: 'An unexpected server error occurred during goal fetching.', error: dbError.message });
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers'; // For address validation
import { supabaseServer } from '@/lib/supabase/server';

// IMPORTANT: Ensure your JWT_SECRET is correctly set in your environment variables.
// It should be the same secret used to sign the JWT during authentication.
const JWT_SECRET = process.env.JWT_SECRET!;

// Supabase client initialization moved directly into the API route

// Basic type for the returned goal from Supabase (adjust as per your actual table row)
interface Goal {
  id: string; // UUID
  contract_goal_id: string;
  creator_address: string;
  referee_address: string;
  success_recipient_address: string;
  failure_recipient_address: string;
  stake_amount: string; // Numeric in DB, but often handled as string in JS to avoid precision issues
  goal_hash: string;
  created_at: string; // TIMESTAMPTZ
  expiry_date: string; // TIMESTAMPTZ
  status: number; // SMALLINT
  description: string;
  title: string;
  transaction_hash: string; // Add this if you store it in DB
}

// Define the expected shape of the incoming request body for goal creation
interface GoalApiRequestBody {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure the request method is POST
  if (req.method !== 'POST') {
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
    userWalletAddress = decodedToken.address as string;

    if (!userWalletAddress) {
      throw new Error('Wallet address not found in authentication token payload.');
    }
  } catch (error: any) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }

  // Standardize the wallet address to lowercase for database consistency.
  const lowercasedUserWalletAddress = userWalletAddress.toLowerCase();
  const lowercasedRefereeAddress = req.body.refereeAddress.toLowerCase();
  const lowercasedSuccessRecipientAddress = req.body.successRecipientAddress.toLowerCase();
  const lowercasedFailureRecipientAddress = req.body.failureRecipientAddress.toLowerCase();
  // 2. Parse and Validate Request Body
  const body: GoalApiRequestBody = req.body;

  const {
    title,
    description,
    expiry_date,
    refereeAddress,
    successRecipientAddress,
    failureRecipientAddress,
    stakeAmount,
    contractGoalId,
    transactionHash,
  } = body;

  // Basic server-side validation (add more as needed)
  if (!title || title.trim().length === 0 || title.length > 255) {
    return res.status(400).json({ message: 'Title is required and must be under 255 characters.' });
  }
  if (!description || description.trim().length === 0) {
    return res.status(400).json({ message: 'Description is required.' });
  }
  if (isNaN(new Date(expiry_date).getTime())) {
    return res.status(400).json({ message: 'Invalid expiry_date date.' });
  }
  if (!ethers.isAddress(refereeAddress)) {
    return res.status(400).json({ message: 'Invalid referee address.' });
  }
  if (!ethers.isAddress(successRecipientAddress)) {
    return res.status(400).json({ message: 'Invalid success recipient address.' });
  }
  if (!ethers.isAddress(failureRecipientAddress)) {
    return res.status(400).json({ message: 'Invalid failure recipient address.' });
  }
  if (parseFloat(stakeAmount) <= 0) {
    return res.status(400).json({ message: 'Stake amount must be a positive number.' });
  }
  if (!contractGoalId || contractGoalId.trim().length === 0) {
    return res.status(400).json({ message: 'Contract Goal ID is required.' });
  }
  if (!transactionHash || transactionHash.trim().length === 0) {
    return res.status(400).json({ message: 'Transaction Hash is required.' });
  }

  // 3. Save Goal to Database (Directly in API route)
  try {

    const newGoalData = {
      title,
      description,
      expiry_date: expiry_date,
      creator_address: lowercasedUserWalletAddress,
      referee_address: lowercasedRefereeAddress,
      success_recipient_address: lowercasedSuccessRecipientAddress,
      failure_recipient_address: lowercasedFailureRecipientAddress,
      stake_amount: stakeAmount, // Ensure this is handled as NUMERIC in DB if it's large
      status: 0, // Default to 'pending' or 'active'
      contract_goal_id: contractGoalId,
      transaction_hash: transactionHash,
      // created_at will be defaulted by Supabase
      // goal_hash: ... (If you pass goalHash from frontend and need it in DB)
    };

    const { data, error } = await supabaseServer
      .from('goals') // Your Supabase table name
      .insert([newGoalData])
      .select() // Select the newly inserted row to return it
      .single(); // Expect a single object back

    if (error) {
      console.error("Supabase insert error:", error);
      throw new Error(`Failed to save goal to database: ${error.message}`);
    }

    if (!data) {
      throw new Error("Supabase returned no data on goal creation.");
    }

    // 4. Return Success Response
    return res.status(201).json({ message: 'Goal created successfully', goal: data as Goal });

  } catch (dbError: any) {
    console.error('An unexpected error occurred during goal creation:', dbError.message);
    return res.status(500).json({ message: 'An unexpected server error occurred during goal creation.', error: dbError.message });
  }
}

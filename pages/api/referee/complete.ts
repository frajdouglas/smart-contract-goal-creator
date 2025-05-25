import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { supabaseServer } from '@/lib/supabase/server';

const JWT_SECRET = process.env.JWT_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { contract_goal_id, transactionHash } = req.body;

    if (!contract_goal_id || !transactionHash) {
        return res.status(400).json({ message: 'Goal ID and transaction hash are required.' });
    }

    const authToken = req.cookies.authToken;

    if (!authToken) {
        return res.status(401).json({ message: 'No authentication token found.' });
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
    const lowercasedUserWalletAddress = userWalletAddress.toLowerCase();

    try {
        const { data: goal, error: fetchError } = await supabaseServer
            .from('goals')
            .select('status, referee_address')
            .eq('contract_goal_id', contract_goal_id)
            .single();

        if (fetchError || !goal) {
            console.error("Supabase fetch goal error:", fetchError?.message || "Goal not found.");
            return res.status(404).json({ message: 'Goal not found or database error.' });
        }

        if (goal.referee_address.toLowerCase() !== lowercasedUserWalletAddress) {
            return res.status(403).json({ message: 'Unauthorized: Only the assigned referee can mark this goal complete.' });
        }
        
        if (goal.status !== '0') {
            return res.status(409).json({ message: `Goal cannot be marked complete. Current status: ${goal.status}.` });
        }

        const { data: updatedGoal, error: updateError } = await supabaseServer
            .from('goals')
            .update({
                status: 1, // '1' for "Referee marked as met"
                transaction_hash: transactionHash // Overwrites the existing hash
            })
            .eq('contract_goal_id', contract_goal_id)
            .select()
            .single();

        if (updateError) {
            console.error("Supabase update goal error:", updateError.message);
            return res.status(500).json({ message: `Failed to update goal status in database: ${updateError.message}` });
        }

        return res.json({ message: 'Goal status updated to complete successfully.', goal: updatedGoal });

    } catch (apiError: any) {
        console.error('An unexpected error occurred in mark goal complete API:', apiError.message);
        return res.status(500).json({ message: 'An unexpected server error occurred.', error: apiError.message });
    }
}
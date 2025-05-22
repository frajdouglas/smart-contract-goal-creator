import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { supabaseServer } from '@/lib/supabase/server';

const JWT_SECRET = process.env.JWT_SECRET!;

export default async function upsert(req: NextApiRequest, res: NextApiResponse) {
    // Ensure the request method is POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const authToken = req.cookies.authToken;

    if (!authToken) {
        return res.status(401).json({ message: 'Authentication required: No auth token found.' });
    }

    let decodedToken: jwt.JwtPayload;
    let walletAddress: string;

    try {
        decodedToken = jwt.verify(authToken, JWT_SECRET) as jwt.JwtPayload;
        walletAddress = decodedToken.walletAddress as string;

        if (!walletAddress) {
            throw new Error('Wallet address not found in authentication token payload.');
        }
    } catch (error: any) {
        console.error('JWT Verification Error:', error.message);
        return res.status(401).json({ message: 'Invalid or expired authentication token.' });
    }

    // Standardize the wallet address to lowercase for database consistency.
    const lowercasedWalletAddress = walletAddress.toLowerCase();

    try {
        const { data: profile, error: selectError } = await supabaseServer
            .from('profiles')
            .select('*')
            .eq('wallet_address', lowercasedWalletAddress)
            .single(); 

        // If no row was found (PGRST116 is the error code for "no rows found in single()"), then insert.
        if (selectError && selectError.code === 'PGRST116') {
            console.log('Profile not found, inserting new profile for:', lowercasedWalletAddress);
            const { data: newProfile, error: insertError } = await supabaseServer
                .from('profiles')
                .insert({ wallet_address: lowercasedWalletAddress })
                .select('*')
                .single(); 
            if (insertError) {
                console.error('Error inserting new profile:', insertError);
                return res.status(500).json({ message: 'Failed to create user profile.', details: insertError.message });
            }

            return res.status(201).json({ message: 'Profile created successfully.', profile: newProfile });

        } else if (selectError) {
            console.error('Error checking existing profile:', selectError);
            return res.status(500).json({ message: 'Failed to check user profile.', details: selectError.message });
        }

         return res.status(200).json({ message: 'Profile already exists.', profile: profile });

    } catch (error: any) {
        console.error('An unexpected error occurred during profile management:', error.message);
        return res.status(500).json({ message: 'An unexpected server error occurred during profile management.' });
    }
}
import { serialize } from 'cookie';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  res.setHeader('Set-Cookie', serialize('authToken', '', {
    httpOnly: true,                
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'strict',           
    path: '/',                     
    expires: new Date(0),          
  }));

  return res.status(200).json({ message: 'Logged out successfully' });
}
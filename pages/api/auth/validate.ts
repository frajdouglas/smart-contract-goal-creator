import { NextApiRequest, NextApiResponse } from 'next';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!; 

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not defined in environment variables.');
  throw new Error('Server configuration error: JWT_SECRET is missing.');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const authToken = req.cookies.authToken;

  if (!authToken) {
    return res.status(401).json({ message: 'No authentication token found.' });
  }

  try {
    const decoded = jwt.verify(authToken, JWT_SECRET) as JwtPayload;

    if (!decoded.address) {
      console.warn('JWT payload missing expected "address" field:', decoded);
      return res.status(401).json({ message: 'Invalid token payload: "address" field missing.' });
    }

    return res.status(200).json({
      message: 'Authentication token is valid.',
      walletAddress: decoded.address,
    });

  } catch (error: any) {
    console.error('JWT verification failed for token:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Authentication token expired.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid authentication token.' });
    } else {
      return res.status(500).json({ message: 'An unexpected server error occurred during token validation.' });
    }
  }
}
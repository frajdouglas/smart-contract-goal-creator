"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import { deleteCookie, getCookie } from "cookies-next";
import { useSDK } from "@metamask/sdk-react"; // Import useSDK
import { postPublicAddress } from "@/lib/api/postPublicAddress";
import { verifySignature } from "@/lib/api/verifySignature";

type AuthContextType = {
  isAuthenticated: boolean;
  userAddress: string | null; // The verified and logged-in address
  walletAddress: string | null; // The currently connected wallet address
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isSignInLoading: boolean; // To indicate if initial auth state is loading
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null); // We still need this local state
  const [isSignInLoading, setIsSignInLoading] = useState(false);
  const [nonce, setNonce] = useState<string | null>(null);
  const router = useRouter();
  const { sdk, connected, account } = useSDK(); // Get SDK states

  // useEffect(() => {
  //   // Check for authToken on initial load
  //   const token = getCookie('authToken');
  //   const storedWallet = localStorage.getItem('walletAddress');

  //   if (storedWallet) {
  //     setWalletAddress(storedWallet); // Restore persisted wallet address
  //     // If a wallet was previously connected, update the SDK's state if needed
  //     if (account !== storedWallet && sdk && !connected) {
  //       sdk.connect().catch(error => console.error("Error auto-connecting:", error));
  //     }
  //   }
  //   if (token && storedWallet) {
  //     setIsAuthenticated(true);
  //     setUserAddress(storedWallet);
  //   }

  //   setIsLoading(false); // Initial load check complete
  // }, [sdk, connected, account]); // Listen for SDK and stored wallet changes

  const connectWallet = async (): Promise<void> => {
    if (sdk) {
      try {
        await sdk.connect();
        // The 'account' state from useSDK will update, triggering the useEffect
      } catch (error) {
        console.error("Error connecting wallet:", error);
        throw error;
      }
    } else {
      console.error("MetaMask SDK not initialized");
      throw new Error("MetaMask SDK not initialized");
    }
  };

  const disconnectWallet = () => {
    if (sdk) {
      sdk.terminate();
      resetAuthState();
    }
  };

  const resetAuthState = () => {
    setWalletAddress(null);
    localStorage.removeItem('walletAddress');
    setIsAuthenticated(false);
    setUserAddress(null);
    setNonce(null);
    deleteCookie('authToken');
  };

  const signIn = async () => {
    if (!account) {
      throw new Error("Wallet not connected");
    }
    setIsSignInLoading(true);
    const newNonce = await postPublicAddress(account);
    if (!newNonce) {
      throw new Error("Nonce not available for signing.");
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      console.log("Provider:", provider);
      const signer = await provider.getSigner(account);
      console.log("Signer:", signer);
      const signature = await signer.signMessage(newNonce.nonce);
      console.log("Signature:", signature);
      const verifyResponse = await verifySignature(account, newNonce.nonce, signature);
      if (verifyResponse?.token) {
        setIsAuthenticated(true);
        setIsSignInLoading(false);
        setUserAddress(account);
      } else {
        resetAuthState();
        setIsSignInLoading(false);
        throw new Error("Failed to verify signature");
      }
    } catch (error) {
      console.error("Error signing in:", error);
      setIsSignInLoading(false);
      resetAuthState();
      throw error;
    }
  };

  const signOut = async () => {
    resetAuthState();
  };

  const value = {
    isAuthenticated,
    userAddress,
    walletAddress: account || null, // Use the 'account' from the SDK, fallback to null
    connectWallet,
    disconnectWallet,
    signIn,
    signOut,
    isSignInLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
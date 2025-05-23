"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { useSDK } from "@metamask/sdk-react";
import { postPublicAddress } from "@/lib/api/postPublicAddress";
import { verifySignature } from "@/lib/api/verifySignature";
import { validateAuthToken } from "@/lib/api/validateAuthToken";
import { deleteAuthCookie } from "@/lib/api/deleteAuthCookie";

type AuthContextType = {
  isAuthenticated: boolean;
  userAddress: string | null;
  walletAddress: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isSignInLoading: boolean;
  isWalletConnecting: boolean;
  signer: ethers.Signer | null;
  provider: ethers.BrowserProvider | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isSignInLoading, setIsSignInLoading] = useState(false);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<ethers.BrowserProvider | null>(null);
  const [currentSigner, setCurrentSigner] = useState<ethers.Signer | null>(null);

  const { sdk, account, connected } = useSDK();

  useEffect(() => {
    const performAuthCheck = async () => {
      if (connected) {
        setIsSignInLoading(true)
        try {
          const { walletAddress: decodedAddress } = await validateAuthToken();
          if (account && decodedAddress.toLowerCase() !== account.toLowerCase()) {
            console.warn(
              "Authentication mismatch detected:",
              "Token:", decodedAddress,
              "MetaMask:", account,
              ". Forcing sign out."
            );
            resetAuthState();
          } else {
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.warn(error);
        }
      }

      setIsSignInLoading(false)
    };

    performAuthCheck();
  }, [connected]);

  useEffect(() => {
    async function setupEthersObjects() {
      if (window.ethereum && account && connected) {
        try {
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          setCurrentProvider(browserProvider);
          const signerInstance = await browserProvider.getSigner(account);
          setCurrentSigner(signerInstance);
        } catch (error) {
          console.error("Error setting up ethers provider/signer in useEffect:", error);
          setCurrentProvider(null);
          setCurrentSigner(null);
        }
      } else {
        setCurrentProvider(null);
        setCurrentSigner(null);
        if (isAuthenticated) {
          setIsAuthenticated(false);
          setUserAddress(null);
        }
      }
    }

    setupEthersObjects();
  }, [account, connected, isAuthenticated]);

  const connectWallet = async (): Promise<void> => {
    if (sdk) {
      try {
        setIsWalletConnecting(true);
        await sdk.connect();
        setIsWalletConnecting(false);
      } catch (error) {
        setIsWalletConnecting(false);
        console.error("Error connecting wallet:", error);
        throw error;
      }
    } else {
      setIsWalletConnecting(false);
      console.error("MetaMask SDK not initialized");
      throw new Error("MetaMask SDK not initialized");
    }
  };

  const disconnectWallet = () => {
    if (sdk) {
      sdk.terminate();
    }
    resetAuthState();
  };

  const resetAuthState = () => {
    setIsAuthenticated(false);
    setUserAddress(null);
    setCurrentProvider(null);
    setCurrentSigner(null);
  };

  const signIn = async () => {
    if (!account || !currentSigner) {
      throw new Error("Wallet not connected or signer not available. Please connect first.");
    }
    setIsSignInLoading(true);

    try {
      const newNonce = await postPublicAddress(account);
      if (!newNonce || !newNonce.nonce) {
        throw new Error("Nonce not available for signing from backend.");
      }

      const signature = await currentSigner.signMessage(newNonce.nonce);
      console.log("Message Signature:", signature);

      const verifyResponse = await verifySignature(account, newNonce.nonce, signature);
      if (verifyResponse?.token) {
        setIsAuthenticated(true);
        setIsSignInLoading(false);
        setUserAddress(account);
      } else {
        resetAuthState();
        setIsSignInLoading(false);
        throw new Error("Failed to verify signature with backend");
      }
    } catch (error) {
      console.error("Error during sign-in process:", error);
      setIsSignInLoading(false);
      resetAuthState();
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await deleteAuthCookie();
      resetAuthState();
    } catch (error) {
      console.error("Failed to sign out on backend, proceeding with client-side cleanup:", error, "please delete 'authtoken' cookie manually");
    }
  };

  const value = {
    isAuthenticated,
    userAddress,
    walletAddress: account || null,
    connectWallet,
    disconnectWallet,
    signIn,
    signOut,
    isSignInLoading,
    isWalletConnecting,
    signer: currentSigner,
    provider: currentProvider
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
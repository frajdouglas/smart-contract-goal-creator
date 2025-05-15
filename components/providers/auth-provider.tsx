"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabaseClient } from "@/lib/supabase/client"
import type { Session, User } from "@supabase/supabase-js"
import { ethers } from "ethers"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  walletAddress: string | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  useEffect(() => {
    const setData = async () => {
      const {
        data: { session },
        error,
      } = await supabaseClient.auth.getSession()
      if (error) {
        console.error(error)
        setIsLoading(false)
        return
      }

      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    }

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    setData()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Check if wallet is already connected
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          if (accounts.length > 0) {
            setWalletAddress(accounts[0])
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error)
        }
      }
    }

    checkWalletConnection()
  }, [])

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0])
        } else {
          setWalletAddress(null)
          // If user disconnects wallet, sign them out
          if (user) {
            signOut()
          }
        }
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      }
    }
  }, [user])

  const signIn = async () => {
    try {
      if (!walletAddress) {
        throw new Error("Please connect your wallet first")
      }

      // Create a message for the user to sign
      const message = `Sign this message to authenticate with Goal Tracker: ${new Date().toISOString()}`

      // Request signature from the user
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const signature = await signer.signMessage(message)

      // Check if a user with this wallet address already exists
      const { data: existingUsers } = await supabaseClient
        .from("users")
        .select("id")
        .eq("wallet_address", walletAddress)
        .limit(1)

      if (existingUsers && existingUsers.length > 0) {
        // User exists, sign them in
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: `${walletAddress.toLowerCase()}@example.com`,
          password: signature.slice(0, 20), // Using part of signature as password (demo only)
        })

        if (error) throw error
      } else {
        // User doesn't exist, sign them up
        const { data, error: signUpError } = await supabaseClient.auth.signUp({
          email: `${walletAddress.toLowerCase()}@example.com`,
          password: signature.slice(0, 20),
          options: {
            data: {
              wallet_address: walletAddress,
            },
          },
        })

        if (signUpError) throw signUpError

        // Create user profile
        if (data.user) {
          const { error: profileError } = await supabaseClient.from("users").insert({
            id: data.user.id,
            wallet_address: walletAddress,
            username: `user_${walletAddress.slice(2, 8)}`,
          })

          if (profileError) throw profileError
        }
      }
    } catch (error) {
      console.error("Error signing in:", error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await supabaseClient.auth.signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask is not installed")
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      setWalletAddress(accounts[0])
      return accounts[0]
    } catch (error) {
      console.error("Error connecting wallet:", error)
      throw error
    }
  }

  const disconnectWallet = () => {
    setWalletAddress(null)
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signOut,
    walletAddress,
    connectWallet,
    disconnectWallet,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

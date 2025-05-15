"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, AlertCircle, LogIn, LogOut } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { useSDK } from "@metamask/sdk-react";

export function ConnectWallet() {
  const { isAuthenticated,walletAddress, connectWallet, disconnectWallet, user, signIn, signOut } = useAuth()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { sdk, connected, connecting, account } = useSDK();


  console.log(isAuthenticated, "isAuthenticated")

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      })
    } catch (err: any) {
      console.error(err)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isAuthenticated ? (
          // User is signed in
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Wallet Connected</p>
                <p className="text-sm text-muted-foreground">{formatAddress(walletAddress || "")}</p>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        ) : (
          // User is not signed in
          <div className="space-y-4">
            {walletAddress ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Connected: {formatAddress(walletAddress)}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={disconnectWallet}>
                    Disconnect
                  </Button>
                </div>
                <Button className="w-full" onClick={signIn} disabled={isSigningIn}>
                  <LogIn className="mr-2 h-4 w-4" />
                  {isSigningIn ? "Signing in..." : "Sign In with Wallet"}
                </Button>
              </div>
            ) : (
              <Button className="w-full" onClick={connectWallet} disabled={isConnecting}>
                <Wallet className="mr-2 h-4 w-4" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

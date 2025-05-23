"use client"

import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { GoalList } from "@/components/goal-list"
import { ConnectWallet } from "@/components/connect-wallet"
import { ConnectWalletButton } from "@/components/ui/connectWalletButton"
import { Badge } from "@/components/ui/badge"
import type { Goal } from "@/types/database"
import { upsertProfile } from "@/lib/api/upsertProfile"
import { useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"

interface HomePageProps {
  recentGoals?: Goal[]
}

// Changed to a client component with props
export default function HomePage({ recentGoals = [] }: HomePageProps): React.ReactNode {
  const { walletAddress, isAuthenticated } = useAuth()

  useEffect(() => {
    if( isAuthenticated ) {
    const fetchOrCreateProfile = async () => {
      try {
        const response = await upsertProfile()
        console.log("Profile upserted:", response.profile)
      } catch (error) {
        console.error("Error upserting profile:", error)
      }
    }
    fetchOrCreateProfile()
  }
  }, [walletAddress, isAuthenticated])


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Goal Accountability Tracker</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Set goals, stake ETH, and achieve more with blockchain-powered accountability
          </p>
        </div>

        <div className="w-full max-w-md">

          <ConnectWallet />
          {/* <MetaMaskProvider debug={false} sdkOptions={sdkOptions}> */}

          {/* <ConnectWalletButton/> */}
          {/* </MetaMaskProvider> */}

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-medium">Create a Goal</h3>
                  <p className="text-sm text-muted-foreground">Define your goal, timeline, and assign a referee</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-medium">Stake ETH</h3>
                  <p className="text-sm text-muted-foreground">Lock your ETH in a secure smart contract</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-medium">Complete Your Goal</h3>
                  <p className="text-sm text-muted-foreground">Work toward your goal with real stakes</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-medium">Get Verified & Rewarded</h3>
                  <p className="text-sm text-muted-foreground">
                    Your referee confirms completion and your ETH is returned
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/create">Create New Goal</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Active Goals</CardTitle>
              <CardDescription>Track your current goal progress</CardDescription>
            </CardHeader>
            <CardContent>
              <GoalList />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/referee">Referee Dashboard</Link>
              </Button>
              <Button asChild>
                <Link href="/goals">View All Goals</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {recentGoals.length > 0 && (
          <Card className="w-full max-w-4xl">
            <CardHeader>
              <CardTitle>Recent Community Goals</CardTitle>
              <CardDescription>See what others are working on</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentGoals.slice(0, 3).map((goal) => (
                  <div key={goal.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{goal.title}</h3>
                      <Badge
                        className={
                          goal.status === "active"
                            ? "bg-blue-500"
                            : goal.status === "completed"
                              ? "bg-green-500"
                              : "bg-red-500"
                        }
                      >
                        {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span>By: {goal.creator?.username || "Anonymous"}</span>
                      <span>{goal.stake_amount} ETH</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <Link href="/explore">Explore More Goals</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}

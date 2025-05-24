// src/app/page.tsx
"use client";

import type React from "react";
import Link from "next/link";
import { useEffect, useState } from "react"; // Import useState
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// import { GoalList } from "@/components/goal-list"; // No longer needed, rendering directly
import { ConnectWallet } from "@/components/connect-wallet";
// import { ConnectWalletButton } from "@/components/ui/connectWalletButton"; // Not used in provided code
import { Badge } from "@/components/ui/badge";
import { upsertProfile } from "@/lib/api/upsertProfile";
import { useAuth } from "@/components/providers/auth-provider";
import { getGoals, FetchedGoal } from "@/lib/api/getGoals";
import { useToast } from "@/hooks/use-toast"; // For toast notifications
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For error display
import { AlertCircle } from "lucide-react"; // Icon for Alert
import { ethers } from "ethers"; // For checksumming addresses

// Import shadcn/ui Table components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface HomePageProps {
  recentGoals?: FetchedGoal[]; // Changed type to FetchedGoal
}

export default function HomePage({ recentGoals = [] }: HomePageProps): React.ReactNode {
  const { walletAddress, isAuthenticated, isWalletConnecting } = useAuth();
  const { toast } = useToast();

  const [userGoals, setUserGoals] = useState<FetchedGoal[]>([]); // State for goals fetched by current user
  const [isLoadingGoals, setIsLoadingGoals] = useState(true); // Loading state for goals
  const [goalsError, setGoalsError] = useState<string | null>(null); // Error state for goals fetching

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch or upsert profile
      const fetchOrCreateProfile = async () => {
        try {
          const response = await upsertProfile();
          console.log("Profile upserted:", response.profile);
        } catch (error) {
          console.error("Error upserting profile:", error);
          // You might want to show a toast here for profile errors
        }
      };
      fetchOrCreateProfile();

      // Fetch user's goals
      const fetchUserGoals = async () => {
        setIsLoadingGoals(true);
        setGoalsError(null);
        try {
          const response = await getGoals();
          // Filter for active goals (status 0: Pending)
          const activeGoals = response.goals.filter(goal => goal.status === 0);
          setUserGoals(activeGoals);
          toast({
            title: "Your goals loaded!",
            description: `Found ${activeGoals.length} active goals.`,
          });
        } catch (err: any) {
          console.error("Failed to fetch user goals:", err);
          setGoalsError(err.message || "Failed to load your goals.");
          toast({
            title: "Failed to load goals",
            description: err.message || "Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingGoals(false);
        }
      };
      fetchUserGoals();
    } else {
      // Clear goals if not authenticated
      setUserGoals([]);
      setIsLoadingGoals(false);
      setGoalsError("Sign in to view your goals.");
    }
  }, [walletAddress, isAuthenticated, toast]); // Dependencies for useEffect

  // Helper function to get status text
  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return "Pending";
      case 1: return "Met";
      case 4: return "Funds Withdrawn (Success)";
      case 5: return "Funds Withdrawn (Failure/Expired)";
      default: return "Unknown";
    }
  };

  // Helper function to get status badge variant (adjust Tailwind classes as needed)
  const getStatusBadgeVariant = (status: number) => {
    switch (status) {
      case 0: return "bg-blue-500 hover:bg-blue-600"; // Pending
      case 1: return "bg-green-500 hover:bg-green-600"; // Met (intermediate)
      case 4: return "bg-green-700 hover:bg-green-800"; // Success Withdrawn
      case 5: return "bg-red-500 hover:bg-red-600"; // Failure Withdrawn
      default: return "bg-gray-500 hover:bg-gray-600";
    }
  };


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
              {isLoadingGoals && <p className="text-center">Loading your active goals...</p>}
              {goalsError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{goalsError}</AlertDescription>
                </Alert>
              )}
              {!isAuthenticated && !isWalletConnecting && (
                <p className="text-center text-muted-foreground">Please connect your wallet to see your goals.</p>
              )}
              {!isLoadingGoals && !goalsError && isAuthenticated && userGoals.length === 0 && (
                <div className="text-center p-4 text-muted-foreground">
                  <p>You have no active goals. Time to create one!</p>
                  <Button asChild className="mt-4">
                    <Link href="/create">Create New Goal</Link>
                  </Button>
                </div>
              )}

              {!isLoadingGoals && !goalsError && userGoals.length > 0 && (
                <div className="overflow-x-auto"> {/* Add overflow for smaller screens */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Stake</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Referee</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userGoals.map((goal) => (
                        <TableRow key={goal.id}>
                          <TableCell className="font-medium">{goal.title}</TableCell>
                          <TableCell>{goal.stake_amount} ETH</TableCell>
                          <TableCell>{new Date(goal.expiry_date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {ethers.getAddress(goal.referee_address).substring(0, 6)}...
                            {ethers.getAddress(goal.referee_address).substring(38)}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-white ${getStatusBadgeVariant(goal.status)}`}>
                              {getStatusText(goal.status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
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
                        className={`text-white ${getStatusBadgeVariant(goal.status)}`}
                      >
                        {getStatusText(goal.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      {/* Assuming creator.username or similar is available from recentGoals source */}
                      <span>By: {ethers.getAddress(goal.creator_address).substring(0, 6)}...</span>
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
  );
}

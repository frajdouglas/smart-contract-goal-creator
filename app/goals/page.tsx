// src/app/goals/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/providers/auth-provider";
import { getGoals,FetchedGoal } from "@/lib/api/getGoals";
import { ethers } from "ethers";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define possible filter states
type GoalFilter = "all" | "active" | "completed" | "failed";

export default function GoalsPage() {
  const { toast } = useToast();
  const { isAuthenticated, isWalletConnecting } = useAuth();

  const [allGoals, setAllGoals] = useState<FetchedGoal[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<FetchedGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State to manage the current filter, defaults to "all"
  const [currentFilter, setCurrentFilter] = useState<GoalFilter>("all");

  // Helper functions for status text and badge styling
  const getStatusText = (status: string) => {
    switch (status) {
      case '0': return "Pending";
      case '1': return "Referee marked as met";
      case '4': return "Funds transferred to Success Recipient";
      case '5': return "Funds transferred to Failure Recipient";
      default: return "Unknown";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case '0': return "bg-blue-500 hover:bg-blue-600"; // Pending
      case '1': return "bg-green-500 hover:bg-green-600"; // Met (intermediate)
      case '4': return "bg-green-700 hover:bg-green-800"; // Success Withdrawn
      case '5': return "bg-red-500 hover:bg-red-600"; // Failure Withdrawn
      default: return "bg-gray-500 hover:bg-gray-600";
    }
  };

  // Effect to fetch all goals
  useEffect(() => {
    const fetchGoals = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        setError("Please connect your wallet to view goals.");
        setAllGoals([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await getGoals();
        setAllGoals(response.goals);
        toast({
          title: "Goals loaded!",
          description: `Found ${response.goals.length} goals.`,
        });
      } catch (err: any) {
        console.error("Failed to fetch goals:", err);
        setError(err.message || "Failed to load goals.");
        toast({
          title: "Failed to load goals",
          description: err.message || "Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoals();
  }, [isAuthenticated, toast]);

  // Effect to filter goals whenever allGoals or currentFilter changes
  useEffect(() => {
    let filtered: FetchedGoal[] = [];
    if (currentFilter === "all") {
      filtered = allGoals;
    } else if (currentFilter === "active") {
      filtered = allGoals.filter(goal => goal.status === 0);
    } else if (currentFilter === "completed") {
      filtered = allGoals.filter(goal => goal.status === 1 || goal.status === 4);
    } else if (currentFilter === "failed") {
      filtered = allGoals.filter(goal => goal.status === 5);
    }
    setFilteredGoals(filtered);
  }, [allGoals, currentFilter]); // Depend on allGoals and currentFilter

  // Handle filter button clicks - simply updates the state
  const handleFilterChange = (filter: GoalFilter) => {
    setCurrentFilter(filter);
  };

  // --- Loading and Error States ---
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">All Goals</h1>
        <div className="flex space-x-2 mb-6">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">All Goals</h1>
        <Alert variant="destructive" className="max-w-4xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        {!isAuthenticated && !isWalletConnecting && (
          <p className="text-center text-muted-foreground mt-4">
            Please connect your wallet to view goals.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">All Goals</h1>

      {/* Filter Buttons */}
      <div className="flex space-x-2 mb-6">
        <Button
          variant={currentFilter === "all" ? "default" : "outline"}
          onClick={() => handleFilterChange("all")}
        >
          All
        </Button>
        <Button
          variant={currentFilter === "active" ? "default" : "outline"}
          onClick={() => handleFilterChange("active")}
        >
          Active
        </Button>
        <Button
          variant={currentFilter === "completed" ? "default" : "outline"}
          onClick={() => handleFilterChange("completed")}
        >
          Completed
        </Button>
        <Button
          variant={currentFilter === "failed" ? "default" : "outline"}
          onClick={() => handleFilterChange("failed")}
        >
          Failed
        </Button>
      </div>

      {/* Goals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Goal List</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredGoals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No goals found for the "{currentFilter}" filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Referee</TableHead>
                    <TableHead>Stake</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGoals.map((goal) => (
                    <TableRow key={goal.id}>
                      <TableCell className="font-medium">{goal.title}</TableCell>
                      <TableCell>
                        {/* Display a shortened checksummed address for creator */}
                        {ethers.getAddress(goal.creator_address).substring(0, 6)}...
                      </TableCell>
                      <TableCell>
                        {/* Display a shortened checksummed address for referee */}
                        {ethers.getAddress(goal.referee_address).substring(0, 6)}...
                      </TableCell>
                      <TableCell>{goal.stake_amount} ETH</TableCell>
                      <TableCell>
                        {goal.expiry_date ? new Date(goal.expiry_date).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-white ${getStatusBadgeVariant(goal.status)}`}>
                          {getStatusText(goal.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/goals/${goal.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
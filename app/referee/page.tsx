// src/app/goals/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/providers/auth-provider";
import { getRefereeGoals, FetchedGoal } from "@/lib/api/getRefereeGoals";
import { ethers } from "ethers";
import { setGoalMetOnChain } from "@/lib/contracts/contractsInteractions/setGoalMetOnChain";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


type GoalFilter = "all" | "active" | "completed" | "failed";

export default function RefereeGoalsPage() {
  const { toast } = useToast();
  const { isAuthenticated, isWalletConnecting, walletAddress, signer } = useAuth();

  const [allGoals, setAllGoals] = useState<FetchedGoal[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<FetchedGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentFilter, setCurrentFilter] = useState<GoalFilter>("all");
  // State to track which row is expanded
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

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
      case '0': return "bg-blue-500 hover:bg-blue-600";
      case '1': return "bg-green-500 hover:bg-green-600";
      case '4': return "bg-green-700 hover:bg-green-800";
      case '5': return "bg-red-500 hover:bg-red-600";
      default: return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const shortenAddress = (address: string | null | undefined) => {
    if (!address) return "N/A";
    try {
      const checksumAddress = ethers.getAddress(address);
      return `${checksumAddress.substring(0, 6)}...${checksumAddress.substring(checksumAddress.length - 4)}`;
    } catch {
      return "Invalid Address";
    }
  };

  const handleSetGoalMet = async (goalId: string, refereeAddress: string, status: string) => {
    if (!signer || !walletAddress) {
      toast({
        title: "Error",
        description: "Wallet not connected.",
        variant: "destructive",
      });
      return;
    }

    if (walletAddress.toLowerCase() !== refereeAddress.toLowerCase()) {
      toast({
        title: "Unauthorized",
        description: "You are not the designated referee for this goal.",
        variant: "destructive",
      });
      return;
    }

    if (status !== '0') {
      toast({
        title: "Invalid Status",
        description: "This goal cannot be marked met in its current state.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const receipt = await setGoalMetOnChain({
        goalId: goalId,
        signer: signer,
      });

      toast({
        title: "Success!",
        description: `Goal ${goalId} marked as met. Funds will be transferred. Transaction: ${receipt.hash}`,
        variant: "default",
      });
      // Refresh the goal list after successful action
      const response = await getRefereeGoals();
      setAllGoals(response.goals);
    } catch (err: any) {
      console.error("Failed to mark goal as met:", err);
      toast({
        title: "Action Failed",
        description: `Could not mark goal as met: ${err.message || "Unknown error."}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


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
        const response = await getRefereeGoals();
        setAllGoals(response.goals);
        toast({
          title: "Goals to referee loaded!",
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

  useEffect(() => {
    let filtered: FetchedGoal[] = [];
    if (currentFilter === "all") {
      filtered = allGoals;
    } else if (currentFilter === "active") {
      filtered = allGoals.filter(goal => goal.status === '0');
    } else if (currentFilter === "completed") {
      filtered = allGoals.filter(goal => goal.status === '1' || goal.status === '4');
    } else if (currentFilter === "failed") {
      filtered = allGoals.filter(goal => goal.status === '5');
    }
    setFilteredGoals(filtered);
  }, [allGoals, currentFilter]);

  const handleFilterChange = (filter: GoalFilter) => {
    setCurrentFilter(filter);
  };

  // Function to toggle expanded row
  const toggleExpand = (goalId: string) => {
    setExpandedGoalId(prevId => (prevId === goalId ? null : goalId));
  };


  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
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

      <Card>
        <CardHeader>
          <CardTitle>Referee Goal List</CardTitle>
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
                    <React.Fragment key={goal.id}>
                      <TableRow>
                        <TableCell className="font-medium">{goal.title}</TableCell>
                        <TableCell>
                          {shortenAddress(goal.creator_address)}
                        </TableCell>
                        <TableCell>
                          {shortenAddress(goal.referee_address)}
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
                        <TableCell className="text-right flex items-center justify-end space-x-2">
                          {walletAddress?.toLowerCase() === goal.referee_address?.toLowerCase() && goal.status === '0' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleSetGoalMet(goal.id, goal.referee_address, goal.status)}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? "Marking Met..." : "Mark Met"}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleExpand(goal.id)}
                          >
                            {expandedGoalId === goal.id ? "Hide Details" : "View Details"}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {/* CONDITIONAL ROW FOR DETAILS */}
                      {expandedGoalId === goal.id && (
                        <TableRow>
                          {/* `colSpan` should match the number of <TableHead> elements */}
                          <TableCell colSpan={7} className="py-4 px-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="font-semibold mb-1">Full Details:</p>
                                <p><strong>Goal ID:</strong> <span className="font-mono text-xs">{goal.id}</span></p>
                                {/* Ensure goal.goal_hash exists in your FetchedGoal type */}
                                <p><strong>Goal Hash:</strong> <span className="font-mono text-xs">{shortenAddress(goal.goal_hash)}</span></p>
                                {/* Ensure goal.description exists in your FetchedGoal type */}
                                <p className="break-words"><strong>Description:</strong> {goal.description || 'N/A'}</p>
                                <p><strong>Success Recipient:</strong> <span className="font-mono text-xs">{shortenAddress(goal.success_recipient_address)}</span></p>
                                <p><strong>Failure Recipient:</strong> <span className="font-mono text-xs">{shortenAddress(goal.failure_recipient_address)}</span></p>
                              </div>
                              <div>
                                <p className="font-semibold mb-1">Timestamps:</p>
                                {/* Ensure goal.creation_timestamp exists in your FetchedGoal type */}
                                <p><strong>Created On:</strong> {goal.creation_timestamp ? new Date(goal.creation_timestamp).toLocaleString() : 'N/A'}</p>
                                <p><strong>Deadline (Local):</strong> {goal.expiry_date ? new Date(goal.expiry_date).toLocaleString() : "N/A"}</p>
                                {/* Add more details as needed from your FetchedGoal type */}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
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
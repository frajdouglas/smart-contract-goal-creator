// src/app/goals/[goalId]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/providers/auth-provider";
import { getGoalById, FetchedGoal } from "@/lib/api/getGoals";

import { DetailDisplayCard } from "@/components/detail-display-card"; // Import the reusable component

export default function GoalDetailPage() {
  const { goalId } = useParams<{ goalId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isWalletConnecting } = useAuth();

  const [goal, setGoal] = useState<FetchedGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGoal = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        setError("Please connect your wallet to view goal details.");
        return;
      }
      if (!goalId) {
        setIsLoading(false);
        setError("No goal ID provided.");
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const fetchedGoal = await getGoalById(goalId);
        setGoal(fetchedGoal);
        toast({
          title: "Goal details loaded!",
          description: `Details for goal "${fetchedGoal.title}" loaded.`,
        });
      } catch (err: any) {
        console.error(`Failed to fetch goal ${goalId}:`, err);
        setError(err.message || "Failed to load goal details.");
        toast({
          title: "Failed to load goal",
          description: err.message || "Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoal();
  }, [goalId, isAuthenticated, toast]);

  const handleBack = () => {
    router.back(); // Navigates back to the previous page (the goals list)
  };

  // ... (Loading and Error states remain the same as previously provided)
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-40 mb-6" /> {/* Back button skeleton */}
        <h1 className="text-3xl font-bold mb-6"><Skeleton className="h-8 w-1/2" /></h1>
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" /> {/* Card skeleton */}
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
            Please connect your wallet to view goal details.
          </p>
        )}
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The goal with ID "{goalId}" could not be found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <DetailDisplayCard
      item={goal}
      titleKey="title"
      onBack={handleBack}
      itemType="Goal"
    />
  );
}
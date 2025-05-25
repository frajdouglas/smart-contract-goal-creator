// src/components/detail-display-card.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { ethers } from "ethers";

// Utility functions (can be placed in a shared utils file for better organization)
// ... (getStatusText, getStatusBadgeVariant, shortenAddress are defined here)

// Interface for props. We use a generic 'item' for reusability.
import { FetchedGoal } from "@/lib/types"; // Reusing FetchedGoal as the example item type

interface DetailDisplayCardProps {
  item: FetchedGoal; // This will be the goal data. Can be extended to FetchedReferee later.
  titleKey: keyof FetchedGoal; // Key to use for the main title (e.g., 'title')
  onBack: () => void;
  itemType: 'Goal' | 'Referee'; // To customize headings/labels if needed
}

export const DetailDisplayCard: React.FC<DetailDisplayCardProps> = ({ item, titleKey, onBack, itemType }) => {
  const goal = item as FetchedGoal; // Cast for explicit access in this example

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="outline" onClick={onBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to {itemType === 'Goal' ? 'Goals' : 'Referees'}
      </Button>
      <h1 className="text-3xl font-bold mb-6">{itemType}: {String(item[titleKey])}</h1> {/* Using String(item[titleKey]) for safety */}

      <Card>
        <CardHeader>
          <CardTitle>{itemType} Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          {/* Goal-specific details */}
          {itemType === 'Goal' && (
            <>
              <div>
                <p className="text-muted-foreground">Status:</p>
                <Badge className={`text-white ${getStatusBadgeVariant(goal.status)}`}>
                  {getStatusText(goal.status)}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Stake Amount:</p>
                <p className="font-medium">{goal.stake_amount} ETH</p>
              </div>
              <div>
                <p className="text-muted-foreground">Deadline:</p>
                <p className="font-medium">
                  {goal.expiry_date ? new Date(goal.expiry_date).toLocaleDateString() : "N/A"}
                </p>
              </div>
              {/* Addresses section for goals */}
              <div className="md:col-span-2">
                <h3 className="text-md font-semibold mt-4 mb-2">Participants & Recipients</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">Creator Address:</p>
                    <p className="font-mono text-xs break-all">{ethers.getAddress(goal.creator_address)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Referee Address:</p>
                    <p className="font-mono text-xs break-all">{ethers.getAddress(goal.referee_address)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Success Recipient Address:</p>
                    <p className="font-mono text-xs break-all">{ethers.getAddress(goal.success_recipient_address)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Failure Recipient Address:</p>
                    <p className="font-mono text-xs break-all">{ethers.getAddress(goal.failure_recipient_address)}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Common description section */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-md font-semibold mb-2">Description</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 min-h-[100px] whitespace-pre-wrap text-base">
              {goal.description || "No description provided."}
            </div>
          </div>

          {/* Add more common or type-specific details here */}

        </CardContent>
      </Card>
    </div>
  );
};
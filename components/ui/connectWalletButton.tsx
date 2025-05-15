"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider"; // Import your useAuth hook
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

export const ConnectWalletButton = () => {
  const { walletAddress, connectWallet, disconnectWallet, isLoading } = useAuth(); // Get states and functions

  return (
    <div className="relative">
      {walletAddress ? (
        <Popover>
          <PopoverTrigger>
            <Button>{walletAddress}</Button>
          </PopoverTrigger>
          <PopoverContent className="mt-2 w-44 bg-gray-100 border rounded-md shadow-lg right-0 z-10 top-10">
            <Button className="w-full hover:bg-gray-200" onClick={disconnectWallet}>
              Disconnect
            </Button>
          </PopoverContent>
        </Popover>
      ) : (
        <Button disabled={isLoading} onClick={connectWallet}>
        this is a connect wallet button
        </Button>
      )}
    </div>
  );
};
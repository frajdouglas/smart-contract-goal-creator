import { ethers, Contract, Signer } from 'ethers';
import deployed from "./contractAddress.json";
import goalFactoryArtifact from "./GoalFactory.json";

interface CreateGoalOnChainArgs {
  description: string;
  deadline: Date;
  stake: string;
  refereeAddress: string;
  successRecipientAddress: string;
  failureRecipientAddress: string;
  signer: Signer;
}

// Update the return type to include the receipt and the extracted contractGoalId
export async function createGoalOnChain({
  description,
  deadline,
  stake,
  refereeAddress,
  successRecipientAddress, // New parameter
  failureRecipientAddress, // New parameter
  signer,
}: CreateGoalOnChainArgs): Promise<{ receipt: ethers.TransactionReceipt; contractGoalId: string }> {
  // --- Input Validation ---
  if (!signer) {
    throw new Error("Wallet signer is not available. Please connect and sign in.");
  }
  if (!ethers.isAddress(refereeAddress)) {
    throw new Error("Invalid referee address.");
  }
  if (!ethers.isAddress(successRecipientAddress)) { // Validate new address
    throw new Error("Invalid success recipient address.");
  }
  if (!ethers.isAddress(failureRecipientAddress)) { // Validate new address
    throw new Error("Invalid failure recipient address.");
  }
  if (parseFloat(stake) <= 0) {
    throw new Error("Stake amount must be greater than zero.");
  }

  // --- Contract Instantiation ---
  const goalFactoryContract = new Contract(
    deployed.address,
    goalFactoryArtifact.abi,
    signer
  );

  // --- Prepare Transaction Arguments ---
  console.log(stake)
  console.log(signer, "signer")

  const escrowAmount = ethers.parseEther(stake);
  const hashedGoalDescription = ethers.keccak256(ethers.toUtf8Bytes(description));
  const deadlineTimestamp = Math.floor(deadline.getTime() / 1000);

  console.log("Preparing to send createGoal transaction...");
  console.log("Referee Address:", refereeAddress);
  console.log("Success Recipient:", successRecipientAddress);
  console.log("Failure Recipient:", failureRecipientAddress);
  console.log("Stake Amount (Wei):", escrowAmount.toString());
  console.log("Hashed Description:", hashedGoalDescription);
console.log("Converted Deadline (ISO String):", new Date(deadlineTimestamp * 1000).toISOString())

  try {

    // --- Send the Transaction ---
    const transactionResponse = await goalFactoryContract.createGoal(
      refereeAddress,
      successRecipientAddress, // Pass the user-specified success recipient
      failureRecipientAddress, // Pass the user-specified failure recipient
      escrowAmount,
      hashedGoalDescription,
      deadlineTimestamp,
      {
        value: escrowAmount, // This sends the ETH stake along with the transaction
      }
    );


    console.log("Transaction submitted!", transactionResponse);

    const receipt = await transactionResponse.wait();

    if (receipt.status !== 1) {
      throw new Error("Blockchain transaction failed (reverted on-chain).");
    }

    let contractGoalId: string

    console.log("Transaction confirmed! Receipt:", receipt);

    // Parse logs to find the GoalCreated event and extract uniqueId
    const goalFactoryInterface = new ethers.Interface(goalFactoryArtifact.abi);
    const goalCreatedEvent = receipt.logs
      .map(log => {
        try {
          return goalFactoryInterface.parseLog(log);
        } catch (e) {
          return null; // Handle cases where log doesn't match ABI
        }
      })
      .find(parsedLog => parsedLog?.name === "GoalCreated");
    console.log(goalFactoryInterface, "goalFactoryInterface");
    console.log(goalCreatedEvent, "goalCreatedEvent");
    if (goalCreatedEvent && goalCreatedEvent.args && goalCreatedEvent.args[0] !== undefined) {
          console.log(goalCreatedEvent.args, "goalCreatedEvent.args");
          console.log(goalCreatedEvent.args[0], "goalCreatedEvent.args[0]");

    contractGoalId = goalCreatedEvent.args[0].toString(); // Access by index 0
    console.log("Extracted Goal ID from contract event:", contractGoalId);
} else {
      console.warn("GoalCreated event not found in transaction receipt. Using transaction hash as goal ID.");
    }

    return { receipt, contractGoalId };
  }
  catch (error: any) { // Use 'any' or more specific type for error
    console.error("Error creating goal on chain:", error);
    if (error.reason) { // Ethers.js often adds a 'reason' property for reverts
      console.error("Revert Reason:", error.reason);
    }
    if (error.data && error.data.message) { // For more detailed RPC errors
      console.error("RPC Error Message:", error.data.message);
    }
    if (error.code) { // Ethers.js error codes
      console.error("Ethers.js Error Code:", error.code);
    }
    throw error; // Re-throw so calling function can handle it
  }
}
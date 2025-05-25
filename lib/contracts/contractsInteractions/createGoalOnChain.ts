import { ethers, Contract, Signer } from 'ethers';
import deployed from "./localhost.json";
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
  const escrowAmount = ethers.parseEther(stake);
  const hashedGoalDescription = ethers.keccak256(ethers.toUtf8Bytes(description));
  const deadlineTimestamp = Math.floor(deadline.getTime() / 1000);

  console.log("Preparing to send createGoal transaction...");
  console.log("Referee Address:", refereeAddress);
  console.log("Success Recipient:", successRecipientAddress);
  console.log("Failure Recipient:", failureRecipientAddress);
  console.log("Stake Amount (Wei):", escrowAmount.toString());
  console.log("Hashed Description:", hashedGoalDescription);
  console.log("Deadline Timestamp:", deadlineTimestamp);

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
  if (goalCreatedEvent && goalCreatedEvent.args && goalCreatedEvent.args.uniqueId) {
    contractGoalId = goalCreatedEvent.args.uniqueId.toString(); // Convert BigInt to string
    console.log("Extracted Goal ID from contract event:", contractGoalId);
  } else {
    console.warn("GoalCreated event not found in transaction receipt. Using transaction hash as goal ID.");
  }

  return { receipt, contractGoalId };
}
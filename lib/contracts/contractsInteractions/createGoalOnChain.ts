import { ethers, Contract, Signer } from 'ethers';
import { deployed, abis } from '@/lib/contracts';

interface CreateGoalOnChainArgs {
  title: string; // Not used directly on-chain but passed for hashing/description
  description: string; // Hashed for on-chain storage
  deadline: Date;
  stake: string; // ETH amount as a string
  refereeAddress: string;
  signer: Signer; // The Ethers.js Signer object
}

export async function createGoalOnChain({
  title, // Used for metadata, not directly on-chain arg but good to keep in args
  description,
  deadline,
  stake,
  refereeAddress,
  signer,
}: CreateGoalOnChainArgs): Promise<ethers.TransactionResponse> {
  if (!signer) {
    throw new Error("Wallet signer is not available. Please connect and sign in.");
  }
  if (!ethers.isAddress(refereeAddress)) {
    throw new Error("Invalid referee address.");
  }
  if (parseFloat(stake) <= 0) {
    throw new Error("Stake amount must be greater than zero.");
  }

  // Instantiate the GoalFactory contract with the provided signer
  const goalFactoryContract = new Contract(
    deployed.GoalFactory.address, // Get the deployed address from your config
    abis.GoalFactory,             // Get the ABI from your config
    signer                        // Connect the contract to the signer for transactions
  );

  // Prepare transaction arguments for the smart contract
  const escrowAmount = ethers.parseEther(stake); // Convert ETH string (e.g., "1.0") to Wei (BigInt)
  const hashedGoalDescription = ethers.keccak256(ethers.toUtf8Bytes(description)); // Hash the description string
  const deadlineTimestamp = Math.floor(deadline.getTime() / 1000); // Convert Date object to Unix timestamp (seconds)

  console.log("Preparing to send createGoal transaction...");
  console.log("Referee Address:", refereeAddress);
  console.log("Stake Amount (Wei):", escrowAmount.toString());
  console.log("Hashed Description:", hashedGoalDescription);
  console.log("Deadline Timestamp:", deadlineTimestamp);
  console.log("Creator/Success Recipient:", signer.address); // Assuming creator is success recipient

  // Execute the createGoal function on the smart contract
  // The 'value' in the overrides object is essential for payable functions
  const transactionResponse = await goalFactoryContract.createGoal(
    refereeAddress,
    // Assuming the creator (signer's address) is the success recipient
    // and the referee is the failure recipient as per previous discussion,
    // or adjust these addresses based on your contract's specific logic.
    signer.address,     // successRecipient (usually the creator)
    refereeAddress,     // failureRecipient (can be the referee, or another address)
    escrowAmount,
    hashedGoalDescription,
    deadlineTimestamp,
    {
      value: escrowAmount, // This sends the ETH stake along with the transaction
    }
  );

  return transactionResponse; // Return the transaction response for further handling (like .wait())
}
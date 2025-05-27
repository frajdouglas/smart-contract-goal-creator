import { ethers, Contract, Signer } from 'ethers';
import deployed from "./contractAddress.json";
import goalFactoryArtifact from "./GoalFactory.json";

interface setGoalFailedOnChainArgs {
    contract_goal_id: number; // The uniqueId of the goal
    signer: Signer;
}

export async function setGoalFailedOnChain({
    contract_goal_id,
    signer,
}: setGoalFailedOnChainArgs): Promise<ethers.TransactionReceipt> {
    console.log("setGoalFailedOnChain called with contract_goal_id:", contract_goal_id); // NEW LOG
    if (!signer) {
        throw new Error("Wallet signer is not available. Please connect and sign in.");
    }

    const goalFactoryContract = new Contract(
        deployed.address,
        goalFactoryArtifact.abi,
        signer
    );
    console.log("GoalFactory Contract instance created:", goalFactoryContract); // NEW LOG
    console.log("Contract Address:", goalFactoryContract.address); // NEW LOG
    console.log("Signer address used for contract:", await signer.getAddress()); // NEW LOG

    try {
        console.log("Attempting to call withdrawFunds on contract..."); // NEW LOG
        const transactionResponse = await goalFactoryContract.withdrawFunds(
            BigInt(contract_goal_id) // Strongly recommend using BigInt here
            // contract_goal_id // If you're explicitly not using BigInt, make sure this is what you want
        );

        console.log("withdrawFunds transaction submitted! TransactionResponse:", transactionResponse); // EXISTING LOG
        const receipt = await transactionResponse.wait();

        if (receipt.status !== 1) {
            throw new Error("Blockchain transaction failed (reverted on-chain).");
        }
        // ... (rest of your function) ...

    } catch (error: any) {
        console.log("Error calling withdrawFunds:", error);
        // ... (rest of your error handling) ...
    }
}
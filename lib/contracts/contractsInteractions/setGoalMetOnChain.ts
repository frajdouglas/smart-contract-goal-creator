// src/lib/contracts/contractsInteractions/setGoalMetOnChain.ts

import { ethers, Contract, Signer } from 'ethers';
import deployed from "./localhost.json";
import goalFactoryArtifact from "./GoalFactory.json";

interface SetGoalMetOnChainArgs {
    contract_goal_id: number; // The uniqueId of the goal
    signer: Signer;
}

export async function setGoalMetOnChain({
    contract_goal_id,
    signer,
}: SetGoalMetOnChainArgs): Promise<ethers.TransactionReceipt> {
    console.log("setGoalMetOnChain called with contract_goal_id:", contract_goal_id); // NEW LOG
    if (!signer) {
        throw new Error("Wallet signer is not available. Please connect and sign in.");
    }
console.log(deployed.address); // NEW LOG
    // --- Contract Instantiation ---
    const goalFactoryContract = new Contract(
        deployed.address,
        goalFactoryArtifact.abi,
        signer
    );
    console.log("GoalFactory Contract instance created:", goalFactoryContract); // NEW LOG
    console.log("Contract Address:", goalFactoryContract.address); // NEW LOG
    console.log("Signer address used for contract:", await signer.getAddress()); // NEW LOG


    try {
        console.log("Attempting to call setGoalMet on contract..."); // NEW LOG
        const transactionResponse = await goalFactoryContract.setGoalMet(
            BigInt(contract_goal_id) // Strongly recommend using BigInt here
            // contract_goal_id // If you're explicitly not using BigInt, make sure this is what you want
        );

        console.log("SetGoalMet transaction submitted! TransactionResponse:", transactionResponse); // EXISTING LOG

        // ... (rest of your function) ...

    } catch (error: any) {
        console.log("Error calling setGoalMet:", error);
        // ... (rest of your error handling) ...
    }
}
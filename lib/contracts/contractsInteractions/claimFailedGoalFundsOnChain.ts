import { ethers, Contract, Signer } from 'ethers';
import deployed from "./contractAddress.json";
import goalFactoryArtifact from "./GoalFactory.json";

interface ClaimFailedGoalFundsParams {
    contract_goal_id: number; // The uniqueId of the goal
    signer: Signer;
}

/**
 * Allows the designated failure recipient to claim staked funds for a goal
 * that has passed its deadline and is not yet complete.
 * @param params.goalId The ID of the goal to claim funds from.
 * @param params.signer The ethers.Signer object of the current wallet (must be the failure recipient).
 * @returns A promise that resolves to the transaction receipt.
 * @throws An error if the transaction fails or conditions are not met.
 */
export async function claimFailedGoalFundsOnChain({ contract_goal_id, signer }: ClaimFailedGoalFundsParams): Promise<ContractTransactionReceipt> {
    if (!signer) {
        throw new Error("No signer available. Please connect your wallet.");
    }

    const goalFactoryContract = new Contract(
        deployed.address, // Your GoalFactory contract address
        goalFactoryArtifact.abi,
        signer // Use the signer for write operations
    );

    console.log(`Attempting to claim funds for Goal ID ${contract_goal_id}...`);

    try {
        // Call the claimFailedFunds function on your smart contract
        // Ensure this function exists in your GoalFactory.sol contract ABI
        const tx = await goalFactoryContract.claimFailedFunds(BigInt(contract_goal_id));

        // Wait for the transaction to be mined
        const receipt = await tx.wait();

        if (!receipt) {
            throw new Error("Transaction failed: No receipt received.");
        }
        console.log(`Funds claimed successfully for Goal ID ${contract_goal_id}. Transaction: ${receipt.hash}`);
        return receipt;

    } catch (error: any) {
        console.error(`Error claiming funds for goal ${contract_goal_id}:`, error);
        let errorMessage = error.message;
        if (error.code === 'CALL_EXCEPTION' && error.data) {
            try {
                const iface = new ethers.Interface(goalFactoryArtifact.abi);
                const decodedError = iface.parseError(error.data);
                if (decodedError && decodedError.name === 'Error') {
                    errorMessage = decodedError.args[0] || 'Unknown contract error';
                }
            } catch (decodeError) {
                console.warn("Could not decode contract error data:", decodeError);
            }
        } else if (error.code === 4001) { // User rejected transaction
            errorMessage = "Transaction rejected by user.";
        }
        throw new Error(`Failed to claim funds: ${errorMessage}`);
    }
}
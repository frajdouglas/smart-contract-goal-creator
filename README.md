# Smart Contract Goal Tracker

## Table of Contents

* [Introduction](#introduction)
* [Features](#features)
* [Technology Stack](#technology-stack)
* [Getting Started](#getting-started)
* [Smart Contract](#smart-contract)
* [Frontend](#frontend)
* [Learning Outcomes & Key Learnings](#learning-outcomes--key-learnings)

---

## Introduction

The Goal Tracker is a decentralized application that facilitates goal-setting with an integrated escrow system on the Ethereum blockchain. It enables users to create verifiable commitments by locking funds in an escrow, to be released to a designated recipient upon the successful completion of a goal (as verified by a referee) or returned to a failure recipient if the goal is not met by a specified expiry. The idea being, those who commit financially to goals are considerably more likely to complete their set challenges. It is mimicking the existing web2 https://www.stickk.com/ application.

This project serves as a practical learning exercise to understand the end-to-end development process of a dApp. It provided hands-on experience with core Web3 concepts, smart contract development, backend DB mimicking of smart contract data and building a frontend interaction layer with Metamask. Is it comprehensively tested? No, the goal was to rapidly build a v0 version and get a foundation on the new Web3 concepts particularly with auth and wallet interactions. Primarily used Gemini 2.5 flash and GPT-4o for coding assistance and discussion about concepts.

## Features

* **Decentralized Goal Creation:** Anyone can connect their metamask wallet and can create a new goal by providing an escrow amount, defining a referee, success/failure recipients, a goal description, and an expiry timestamp.
* **Escrowed Funds:** Funds are held securely in the smart contract until the goal's outcome is determined.
* **Referee Verification:** A designated referee can mark a pending goal as "met," triggering the release of funds to the success recipient.
* **Automated Failure Withdrawal:** If a goal expires and remains pending, the failure recipient can withdraw the escrowed funds.
* **Transparent Status Tracking:** All goal states and fund movements are recorded on the blockchain and accessible via events.
* **Responsive Frontend:** A user-friendly interface built with Next.js.
* **Testnet Deployment:** Currently deployed and testable on the Sepolia Ethereum testnet.

## Technology Stack

* **Smart Contracts:**
    * Solidity (`^0.8.0`)
    * Hardhat (for development, testing, and deployment)
* **Frontend:**
    * Next.js
    * TypeScript
    * React
    * ethers.js
    * Tailwind CSS 
* **Wallet Integration:**
    * Metamask
* **Database (Off-chain):**
    * Supabase

## Getting Started

Follow these instructions to set up and run the project locally for development and testing.

### Prerequisites

* Node.js (LTS version recommended)
* npm or Yarn (npm is used in examples)
* Git
* MetaMask browser extension configured for the Sepolia Testnet.
* Sepolia ETH for gas fees (obtainable from a [Sepolia Faucet](https://sepoliafaucet.com/)).
* A Supabase project set up for your database.

### Installation and running locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/frajdouglas/smart-contract-goal-creator.git
    cd your-repo-name
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up Supabase Database:**
    * Create a new project in Supabase.
    * Follow Supabase's documentation to set up your tables. For this project, you'll likely need a table to store goal data (mimicking the on-chain data) and possibly user-specific data. Update the env variables to connect to the database instance.

4.  **Start the Next.js development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```

    The application will be accessible at `http://localhost:3000`.

### Environment Variables

Create a `.env.local` file in the root of your project and add the following environment variables:


JWT_SECRET
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URLSUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_GOAL_FACTORY_ADDRESS_SEPOLIA
NEXT_PUBLIC_GOAL_FACTORY_ADDRESS_LOCAL


### Running Blockchain Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/frajdouglas/escrow-goal-contracts.git
    cd your-repo-name
    ```

2.  **Compile Smart Contracts:**
    ```bash
    npx hardhat compile
    ```

3.  **Deploy Smart Contract locally:**

    First, ensure your `hardhat.config.js` is set up correctly for Sepolia and your `PRIVATE_KEY` env variable is configured.
    ```bash
    npx hardhat run scripts/deploy.ts --network localhost
    ```

    * *Important:* After deployment, update `NEXT_PUBLIC_GOAL_FACTORY_CONTRACT_ADDRESS` in your `.env.local` with the new address.

## Smart Contract

The contract logic resides in `contracts/GoalFactory.sol` contained within the project here: https://github.com/frajdouglas/escrow-goal-contracts.git 


### Frontend

The frontend is built with Next.js, providing a user-friendly interface for interacting with the GoalFactory smart contract.

## Key Components

Goal Creation Form: Allows users to input all necessary details for a new goal.

Goal List/Details: Displays existing goals, their status, and allows interaction based on role (e.g., referee action buttons, withdrawal buttons).

Wallet Connection UI: Manages connecting the user's MetaMask wallet and authenticating on the Next.js backend and issuing a session cookie to frontend.

## Usage Guide

### Creating a Goal

Connect your MetaMask wallet to the Sepolia Testnet.

Ensure your wallet has sufficient Sepolia ETH to cover the escrow amount and gas fees.
Navigate to the "Create Goal" section of the dApp.

Fill in the details:
* Referee Address: The Ethereum address of the person who will verify the goal.
* Success Recipient Address: The address to send funds to if the goal is met.
* Failure Recipient Address: The address to send funds to if the goal expires or is not met.
* Escrow Amount: The amount of ETH (in Wei or a readable unit, depending on your UI) to put into escrow.
* Goal Hash: A bytes32 hash representing the off-chain description or criteria of the goal (e.g., keccak256 hash of a string).
* Expiry Date/Time: The timestamp when the goal will expire if not met.

Confirm the transaction in MetaMask.

Once the transaction is confirmed, the dApp will extract the uniqueId of your new goal.

### Setting a Goal as Met (Referee)

Connect your MetaMask wallet with the address designated as the referee for a specific pending goal.

Locate the goal in the dApp's interface.

If the goal is pending and you are the designated referee, an option to "Mark as Met" (or similar) will be available.

Confirm the transaction in MetaMask to update the goal status and disburse funds to the success recipient.

### Withdrawing Funds (Failure Recipient)

Connect your MetaMask wallet with the address designated as the failureRecipient for a specific goal.

Locate the goal in the dApp's interface.

If the goal has expired and is still pending (status 0), an option to "Withdraw Funds" (or similar) will be available.

Confirm the transaction in MetaMask to withdraw the escrowed funds.

## Learning Outcomes & Key Learnings

This project served as practice building a full-stack decentralized application.


 #### End-to-End dApp Development: 
 * Gaining a holistic understanding of the workflow from smart contract design and deployment to frontend integration.

 #### Smart Contract Development:

* Writing and deploying Solidity contracts using Hardhat.
* Understanding msg.value and payable functions for handling native token transfers.
* Implementing access control with modifiers (onlyReferee, onlyFailureRecipient).
* Designing state management within a smart contract (e.g., status enum).
* Emitting and parsing blockchain events for off-chain data synchronization and user feedback.

#### Web3 Frontend Integration (ethers.js):

* Setting up wallet connection flows using Metamask to enable user interaction with the blockchain.
* Sending signed transactions to the smart contract from the frontend.
* Listening for and decoding contract events from transaction receipts to extract crucial on-chain data.
* Implementing a basic wallet-based authentication system where users sign a nonce (a unique message) to prove ownership of their wallet address, enabling personalized data loading or specific actions tied to their public key.
* Mimicking on-chain smart contract data (like Goal structs) in a traditional database (Supabase) to enable faster queries, richer filtering, and easier personal data loading (e.g., displaying goals created by the connected user).
* Using Hardhat for compiling, testing, and deploying Solidity contracts efficiently.

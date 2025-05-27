import { ethers } from "ethers";
import deployed from "./contractAddress.json";
import goalFactoryArtifact from "./GoalFactory.json";
import { useAuth } from "@/components/providers/auth-provider";

const { signer } = useAuth()

export const goalFactoryContract = new ethers.Contract(
  deployed.address,
  goalFactoryArtifact.abi,
  signer
)
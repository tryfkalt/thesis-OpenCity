import { useState } from "react";
import { ethers } from "ethers";
import { useMoralis, useWeb3Contract } from "react-moralis";
import axios from "axios";
import {
  abiGovernor,
  abiProposalContract,
  contractAddressesGovernor,
  contractAddressesProposalContract,
} from "../../constants";
import { useNotification } from "web3uikit";
import styles from "../../styles/Queue-Execute.module.css";

const ExecuteProposal = ({ proposalDetails, onExecuted }) => {
  const { chainId: chainIdHex, account } = useMoralis();
  const chainId = parseInt(chainIdHex, 16); // Convert chainId to integer
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const governorAddress = contractAddressesGovernor[chainId][0];
  const proposalContractAddress = contractAddressesProposalContract[chainId][0];

  const dispatch = useNotification();
  const { runContractFunction } = useWeb3Contract();

  const executeProposal = async () => {
    try {
      setLoading(true);
      setMessage("Executing proposal...");
      console.log("Executing proposal:", proposalDetails);
      const SCALING_FACTOR = 1e6; // Scale factor for fixed-point representation
      const functionToCall = "storeProposal";
      const proposalInterface = new ethers.utils.Interface(abiProposalContract);
      const args = [
        proposalDetails.title,
        proposalDetails.description,
        ethers.BigNumber.from((proposalDetails.coordinates.lat * SCALING_FACTOR).toFixed(0)), // Scale latitude
        ethers.BigNumber.from((proposalDetails.coordinates.lng * SCALING_FACTOR).toFixed(0)), // Scale longitude
        account,
        proposalDetails.ipfsHash,
      ];
      const encodedFunctionCall = proposalInterface.encodeFunctionData(functionToCall, args);
      const descriptionHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(`${proposalDetails.description}#${proposalDetails.ipfsHash}`)
      );

      const executeOptions = {
        abi: abiGovernor,
        contractAddress: governorAddress,
        functionName: "execute",
        params: {
          targets: [proposalContractAddress],
          values: [0], // No ETH sent
          calldatas: [encodedFunctionCall],
          descriptionHash,
        },
      };

      await runContractFunction({
        params: executeOptions,
        onSuccess: (tx) => handleExecuteSuccess(tx),
        onError: (error) => handleExecuteError(error),
      });
    } catch (error) {
      setMessage("Error executing proposal: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteSuccess = async (tx) => {
    try {
      await tx.wait(1);
      setMessage("Proposal executed successfully!");

      dispatch({
        type: "success",
        message: "Proposal executed successfully!",
        title: "Execute Proposal",
        position: "topR",
      });

      const response = await axios.post(`http://localhost:5000/proposals/${proposalDetails.proposalId}/txhash`, {
        txHash: tx.hash
      });
      
      // Retrieve the updated proposal details
      const proposalOptions = {
        abi: abiProposalContract,
        contractAddress: proposalContractAddress,
        functionName: "getProposal",
        params: { proposalId: proposalDetails.proposalId },
      };

      const proposal = await runContractFunction({ params: proposalOptions });
      console.log("Updated proposal details:", proposal);

      // Notify parent about execution success and provide the transaction hash
      if (onExecuted) {
        onExecuted(tx.hash, proposal);
      }
    } catch (error) {
      console.error("Error handling execute success:", error);
      setMessage("Error handling execute success: " + error.message);
    }
  };

  const handleExecuteError = (error) => {
    console.error("Error executing proposal:", error);
    setMessage("Error executing proposal");
    dispatch({
      type: "error",
      message: "Error executing proposal",
      title: "Execute Proposal",
      position: "topR",
    });
  };

  return (
    <div className={styles.container}>
      <button onClick={executeProposal} className={styles.executeButton} disabled={loading}>
        {loading ? "Executing..." : "Execute Proposal"}
      </button>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default ExecuteProposal;

// components/ExecuteProposal.js
import { useState } from "react";
import { ethers } from "ethers";
import { useMoralis, useWeb3Contract } from "react-moralis";
import {
  abiGovernor,
  abiProposalContract,
  contractAddressesGovernor,
  contractAddressesProposalContract,
} from "../../constants";
import { useNotification } from "web3uikit";
import styles from "../../styles/Queue-Execute.module.css";

const ExecuteProposal = ({ proposalDetails }) => {
  const { chainId: chainIdHex } = useMoralis();
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

      const functionToCall = "storeProposal";
      const proposalInterface = new ethers.utils.Interface(abiProposalContract);
      const args = [
        proposalDetails.title,
        proposalDetails.description,
        ethers.BigNumber.from(parseFloat(proposalDetails.coordinates.lat).toFixed(0)),
        ethers.BigNumber.from(parseFloat(proposalDetails.coordinates.lng).toFixed(0)),
      ];
      const encodedFunctionCall = proposalInterface.encodeFunctionData(functionToCall, args);
      const descriptionHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(proposalDetails.description)
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

      console.log("Proposal executed successfully!");
      const stateOptions = {
        abi: abiGovernor,
        contractAddress: governorAddress,
        functionName: "state",
        params: { proposalId: proposalDetails.proposalId },
      };
      // Fetch proposal details after execution
      const proposalState = await runContractFunction({ params: stateOptions });
      console.log("Proposal state:", proposalState);

      const proposalSnapshotOptions = {
        abi: abiGovernor,
        contractAddress: governorAddress,
        functionName: "proposalSnapshot",
        params: { proposalId: proposalDetails.proposalId },
      };
      const proposalSnapshotBlock = await runContractFunction({ params: proposalSnapshotOptions });
      console.log("Proposal snapshot block:", proposalSnapshotBlock);

      // Fetch the quorum at the snapshot block number
      const quorumOptions = {
        abi: abiGovernor,
        contractAddress: governorAddress,
        functionName: "quorum",
        params: { blockNumber: proposalSnapshotBlock },
      };
      const quorumValue = await runContractFunction({ params: quorumOptions });

      const proposalOptions = {
        abi: abiProposalContract,
        contractAddress: proposalContractAddress,
        functionName: "getAllProposals",
      };
      const proposals = await runContractFunction({ params: proposalOptions });
      console.log("Proposals:", proposals);
    } catch (error) {
      console.error("Error handling execute success:", error);
      setMessage("Error handling execute success: " + error.message);
    }
  };
  const handleExecuteError = (error) => {
    console.error("Error executing proposal:", error);
    setMessage("Error executing proposal: " + error.message);
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

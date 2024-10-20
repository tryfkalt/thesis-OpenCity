import { useState } from "react";
import { ethers } from "ethers";
import { useMoralis, useWeb3Contract } from "react-moralis";
import {
  abiGovernor,
  abiHazardProposal,
  contractAddressesGovernor,
  contractAddressesHazard,
} from "../../constants";
import { useNotification } from "web3uikit";

const QueueAndExecuteProposal = ({ proposalDetails }) => {
  const { isWeb3Enabled, chainId: chainIdHex, account } = useMoralis();
  const chainId = parseInt(chainIdHex, 16); // Convert chainId to integer

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const governorAddress = contractAddressesGovernor[chainId][0];
  const hazardAddress = contractAddressesHazard[chainId][0];

  const dispatch = useNotification();
  const { runContractFunction } = useWeb3Contract();

  async function queueProposal() {
    try {
      setLoading(true);
      setMessage("Queueing proposal...");

      console.log("Queueing proposal...");

      const functionToCall = "storeHazard";
      const proposalInterface = new ethers.utils.Interface(abiHazardProposal);
      const args = [
        proposalDetails.title,
        proposalDetails.description,
        ethers.BigNumber.from(parseFloat(proposalDetails.coordinates.lat).toFixed(0)),
        ethers.BigNumber.from(parseFloat(proposalDetails.coordinates.lng).toFixed(0)),
      ];
      console.log(args);
      const encodedFunctionCall = proposalInterface.encodeFunctionData(functionToCall, args);
      console.log("Encoded function call:", encodedFunctionCall);
      const descriptionHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(proposalDetails.description)
      );
      console.log("Description hash:", descriptionHash);
      const queueOptions = {
        abi: abiGovernor,
        contractAddress: governorAddress,
        functionName: "queue",
        params: {
          targets: [hazardAddress],
          values: [0], // No ETH sent
          calldatas: [encodedFunctionCall],
          descriptionHash,
        },
      };

      await runContractFunction({
        params: queueOptions,
        onSuccess: (tx) => handleQueueSuccess(tx, { title, description, coordinates }),
        onError: (error) => handleQueueError(error),
      });
    } catch (error) {
      console.error("Error queueing proposal:", error);
      setMessage("Error queueing proposal: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleQueueSuccess = async (tx, proposalData) => {
    try {
      const queueReceipt = await tx.wait(1);
      setMessage("Proposal queued successfully!");

      // Pin proposal data to IPFS using Pinata
      const pinataResponse = await pinToIPFS(proposalData);
      const ipfsHash = pinataResponse?.data?.IpfsHash;

      if (!ipfsHash) {
        throw new Error("Failed to pin data to IPFS");
      }

      // Send proposal data (including IPFS hash) to backend
      const response = await axios.post("http://localhost:5000/", {
        ...proposalData,
        ipfsHash,
      });
      dispatch({
        type: "success",
        message: "Proposal queued successfully!",
        title: "Queue Proposal",
        position: "topR",
      });

      console.log("Proposal queued successfully!");
    } catch (error) {
      console.error("Error handling queue success:", error);
      setMessage("Error handling queue success: " + error.message);
    }
  };

  const handleQueueError = (error) => {
    console.error("Error queueing proposal:", error);
    setMessage("Error queueing proposal: " + error.message);
  };

  const pinToIPFS = async (proposalData) => {
    try {
      const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
      const response = await axios.post(url, proposalData, {
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
        },
      });
      console.log("IPFS response:", response);
      return response;
    } catch (error) {
      console.error("Error pinning data to IPFS:", error);
      setMessage("Failed to pin data to IPFS.");
      throw error;
    }
  };
  // Function to execute the proposal
  async function executeProposal() {
    try {
      setLoading(true);
      setMessage("Executing proposal...");

      console.log("Executing proposal...");

      const executeOptions = {
        abi: abiGovernor,
        contractAddress: governorAddress,
        functionName: "execute",
        params: {
          proposalId: proposalDetails.proposalId,
        },
      };

      await runContractFunction({
        params: executeOptions,
        onSuccess: (tx) => handleExecuteSuccess(tx),
        onError: (error) => handleExecuteError(error),
      });
    } catch (error) {
      console.error("Error executing proposal:", error);
      setMessage("Error executing proposal: " + error.message);
    } finally {
      setLoading(false);
    }
  }

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
      console.log("Quorum required:", quorumValue.toString());
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
    <div>
      <button onClick={queueProposal} disabled={loading}>
        {loading ? "Queueing..." : "Queue Proposal"}
      </button>
      <button onClick={executeProposal} disabled={loading}>
        {loading ? "Executing..." : "Execute Proposal"}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default QueueAndExecuteProposal;

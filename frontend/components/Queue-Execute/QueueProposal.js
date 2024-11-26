// components/QueueProposal.js
import { useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { useMoralis, useWeb3Contract } from "react-moralis";
import {
  abiGovernor,
  abiProposalContract,
  contractAddressesGovernor,
  contractAddressesProposalContract,
} from "../../constants";
import { useNotification } from "web3uikit";
import styles from "../../styles/Queue-Execute.module.css";

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

const QueueProposal = ({ proposalDetails }) => {
  const { chainId: chainIdHex } = useMoralis();
  const chainId = parseInt(chainIdHex, 16); // Convert chainId to integer

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const governorAddress = contractAddressesGovernor[chainId][0];
  const proposalContractAddress = contractAddressesProposalContract[chainId][0];

  const dispatch = useNotification();
  const { runContractFunction } = useWeb3Contract();

  async function queueProposal() {
    try {
      setLoading(true);
      setMessage("Queueing proposal...");

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

      const queueOptions = {
        abi: abiGovernor,
        contractAddress: governorAddress,
        functionName: "queue",
        params: {
          targets: [proposalContractAddress],
          values: [0], // No ETH sent
          calldatas: [encodedFunctionCall],
          descriptionHash,
        },
      };

      await runContractFunction({
        params: queueOptions,
        onSuccess: (tx) => handleQueueSuccess(tx, proposalDetails),
        onError: (error) => handleQueueError(error),
      });
    } catch (error) {
      console.log("Error queueing proposal:", error);
      setMessage("Error queueing proposal: " + error.message);
    } finally {
      setLoading(false);
    }
  }
  const handleQueueSuccess = async (tx, proposalData) => {
    try {
      console.log("proposalData is :", proposalData);
      const queueReceipt = await tx.wait(1);
      setMessage("Proposal queued successfully!");
      
      // Pin proposal data to IPFS using Pinata
      const pinataResponse = await pinToIPFS(proposalData);
      const ipfsHash = pinataResponse?.data?.IpfsHash;

      if (!ipfsHash) {
        throw new Error("Failed to pin data to IPFS");
      }

      // Send proposal data (including IPFS hash) to backend
      // const response = await axios.post("http://localhost:5000/", {
      //   ...proposalData,
      //   ipfsHash,
      // });
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
        headers: { Authorization: `Bearer ${PINATA_JWT}` },
      });
      return response;
    } catch (error) {
      setMessage("Failed to pin data to IPFS.");
      throw error;
    }
  };

  return (
    <div className={styles.container}>
      <button onClick={queueProposal} className={styles.queueButton} disabled={loading}>
        {loading ? "Queueing..." : "Queue Proposal"}
      </button>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default QueueProposal;

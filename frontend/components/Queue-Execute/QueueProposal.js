import { useState } from "react";
import { ethers } from "ethers";
import { useMoralis, useWeb3Contract } from "react-moralis";
import pinToIPFS from "../../utils/pinToIPFS";
import {
  abiGovernor,
  abiProposalContract,
  contractAddressesGovernor,
  contractAddressesProposalContract,
} from "../../constants";
import { SCALING_FACTOR } from "../../constants/variables";
import { useNotification } from "web3uikit";
import Spinner from "../Spinner/Spinner";
import styles from "../../styles/Queue-Execute.module.css";

const QueueProposal = ({ proposalDetails }) => {
  const { chainId: chainIdHex, account } = useMoralis();
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
        ethers.BigNumber.from((proposalDetails.coordinates.lat * SCALING_FACTOR).toFixed(0)),
        ethers.BigNumber.from((proposalDetails.coordinates.lng * SCALING_FACTOR).toFixed(0)),
        account,
        proposalDetails.ipfsHash,
        proposalDetails.category,
      ];
      const encodedFunctionCall = proposalInterface.encodeFunctionData(functionToCall, args);

      const descriptionHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(`${proposalDetails.description}#${proposalDetails.ipfsHash}`)
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
        gasLimit: ethers.utils.hexlify(500000),
      };

      await runContractFunction({
        params: queueOptions,
        onSuccess: (tx) => handleQueueSuccess(tx, proposalDetails),
        onError: (error) => handleQueueError(error),
      });
    } catch (error) {
      console.log("Error queueing proposal:", error);
      setMessage("Error queueing proposal: ");
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

      dispatch({
        type: "success",
        message: "Proposal queued successfully!",
        title: "Queue Proposal",
        position: "topR",
      });
      console.log("Proposal queued successfully!");
    } catch (error) {
      console.error("Error handling queue success:", error);
      setMessage("Error handling queue success.");
    }
  };

  const handleQueueError = (error) => {
    console.error("Error queueing proposal:", error);
    setMessage("Error queueing proposal: " + error.message);
  };

  return (
    <div className={styles.container}>
      <button onClick={queueProposal} className={styles.queueButton} disabled={loading}>
        {loading ? "Queueing..." : "Queue Proposal"}
      </button>
      {loading && <Spinner />}
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default QueueProposal;

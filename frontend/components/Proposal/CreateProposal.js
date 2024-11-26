import { useEffect, useState } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { ethers } from "ethers";
import styles from "../../styles/ProposalForm.module.css";
import {
  abiProposalContract,
  contractAddressesProposalContract,
  abiGovernor,
  contractAddressesGovernor,
  abiGovernanceToken,
  contractAddressesGovernanceToken,
} from "../../constants";
import { useNotification, Form } from "web3uikit";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_API_SECRET = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY;
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

const ProposalForm = ({ onProposalSubmit, coordinates }) => {
  const { isWeb3Enabled, chainId: chainIdHex, account } = useMoralis();
  const chainId = parseInt(chainIdHex, 16);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [canPropose, setCanPropose] = useState(false);
  const [proposalThreshold, setProposalThreshold] = useState(null);

  const governorAddress =
    chainId in contractAddressesGovernor ? contractAddressesGovernor[chainId][0] : null;
  const governanceTokenAddress =
    chainId in contractAddressesGovernanceToken
      ? contractAddressesGovernanceToken[chainId][0]
      : null;
  const proposalContractAddress =
    chainId in contractAddressesProposalContract ? contractAddressesProposalContract[chainId][0] : null;

  const dispatch = useNotification();
  const { runContractFunction } = useWeb3Contract();

  async function checkProposalEligibility() {
    try {
      const thresholdOptions = {
        abi: abiGovernor,
        contractAddress: governorAddress,
        functionName: "proposalThreshold",
      };
      const votingPowerOptions = {
        abi: abiGovernanceToken,
        contractAddress: governanceTokenAddress,
        functionName: "getVotes",
        params: { account },
      };

      const [threshold, votingPower] = await Promise.all([
        runContractFunction({ params: thresholdOptions }),
        runContractFunction({ params: votingPowerOptions }),
      ]);
      console.log("Proposal Threshold:", threshold.toString());
      console.log("Voting Power:", votingPower.toString());
      setProposalThreshold(threshold);
      setCanPropose(ethers.BigNumber.from(votingPower).gte(threshold));
    } catch (error) {
      console.error("Error checking proposal eligibility:", error);
    }
  }
  async function createProposal(data) {
    try {
      if (!canPropose) {
        dispatch({
          type: "error",
          message: "Proposal threshold not met. Voting power must be greater than threshold.",
          title: "Transaction Notification",
          position: "topR",
        });
        return;
      }
      setLoading(true);
      setMessage("");
      console.log("Creating proposal...");

      const title = data.data[0].inputResult;
      const description = data.data[1].inputResult;
      const lat = ethers.BigNumber.from((coordinates.lat).toFixed(0));
      const lng = ethers.BigNumber.from((coordinates.lng).toFixed(0));
      

      const proposalData = { title, description, coordinates: { lat: coordinates.lat, lng: coordinates.lng } };
      console.log("CreatedProposalData",proposalData);
      // Pin data to IPFS to get the hash
      const pinataResponse = await pinToIPFS(proposalData);
      
      const ipfsHash = pinataResponse?.data?.IpfsHash;

      if (!ipfsHash) {
        throw new Error("Failed to pin data to IPFS");
      }

      // Use the IPFS hash in the proposal description
      const fullDescription = `${description}#${ipfsHash}`;

      const functionToCall = "storeProposal";
      const proposalInterface = new ethers.utils.Interface(abiProposalContract);
      const args = [title, description, lat, lng];
      const encodedFunctionCall = proposalInterface.encodeFunctionData(functionToCall, args);

      const createProposalOptions = {
        abi: abiGovernor,
        contractAddress: governorAddress,
        functionName: "propose",
        params: {
          targets: [proposalContractAddress],
          values: [0],
          calldatas: [encodedFunctionCall],
          description: fullDescription,
        },
      };

      await runContractFunction({
        params: createProposalOptions,
        onSuccess: (tx) => handleSuccess(tx, { ...proposalData, ipfsHash }),
        onError: (error) => handleError(error),
      });
    } catch (error) {
      console.error("Error creating proposal:", error);
      setMessage("Error creating proposal: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSuccess = async (tx, proposalData) => {
    try {
      const proposalReceipt = await tx.wait(1);
      const proposalId = proposalReceipt.events[0].args.proposalId.toString();
      const proposer = account;
      proposalData = { ...proposalData, proposalId, proposer };
      console.log("Proposal data:", proposalData);
      // const pinataResponse = await pinToIPFS(proposalData);
      // const ipfsHash = pinataResponse?.data?.IpfsHash;

      // if (!ipfsHash) throw new Error("Failed to pin data to IPFS");

      // Send proposal data (including IPFS hash) to backend
      // const response = await axios.post("http://localhost:5000/proposals", {
      //   ...proposalData,
      //   ipfsHash,
      // });

      await fetchProposalDetails(proposalId);
      setMessage("Proposal submitted successfully on the blockchain and saved to backend!");

      // Dispatch success notification
      dispatch({
        type: "success",
        message: "Proposal submitted successfully!",
        title: "Transaction Notification",
        position: "topR",
      });

      setTitle("");
      setDescription("");
      onProposalSubmit(proposalData);
    } catch (error) {
      console.error("Error saving proposal:", error);
      setMessage("Failed to save proposal. Please check the console for details.");
    }
  };

  const fetchProposalDetails = async (proposalId) => {
    try {
      const options = {
        abi: abiGovernor,
        contractAddress: governorAddress,
      };

      const stateOptions = {
        ...options,
        functionName: "state",
        params: { proposalId },
      };

      const snapshotOptions = {
        ...options,
        functionName: "proposalSnapshot",
        params: { proposalId },
      };

      const deadlineOptions = {
        ...options,
        functionName: "proposalDeadline",
        params: { proposalId },
      };

      const proposalState = await runContractFunction({ params: stateOptions });
      const proposalSnapshot = await runContractFunction({ params: snapshotOptions });
      const proposalDeadline = await runContractFunction({ params: deadlineOptions });

      // Fetch the quorum at the snapshot block number
      const quorumOptions = {
        abi: abiGovernor,
        contractAddress: governorAddress,
        functionName: "quorum",
        params: { blockNumber: proposalSnapshot },
      };

      const quorumValue = await runContractFunction({ params: quorumOptions });

      console.log("Proposal State:", proposalState);
      console.log("Proposal Snapshot (Block Number):", proposalSnapshot.toString());
      console.log("Proposal Deadline (Block Number):", proposalDeadline.toString());
      console.log("Quorum required:", quorumValue);
    } catch (error) {
      console.error("Error fetching proposal details:", error);
    }
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

  const handleError = (error) => {
    console.error("Proposal submission error:", error);
    setMessage("Proposal submission failed. Please see console for details.");
    setLoading(false);
  };

  async function updateUI() {
    if (isWeb3Enabled) {
      console.log("Web3 is enabled!");
    } else {
      console.log("Web3 is not enabled.");
    }
  }

  useEffect(() => {
    if (isWeb3Enabled && account && governorAddress) {
      checkProposalEligibility();
    }
  }, [isWeb3Enabled, account, governorAddress]);

  useEffect(() => {
    if (isWeb3Enabled) updateUI();
  }, [isWeb3Enabled]);

  return (
    <div className={styles["proposal-form"]}>
      <Form
        className={styles["form-content"]}
        onSubmit={createProposal}
        data={[
          { name: "Title", type: "text", value: title, key: "title", inputWidth: "100%" },
          {
            name: "Description",
            type: "textarea",
            value: description,
            key: "description",
            inputWidth: "100%",
          },
          {
            name: "Latitude",
            type: "text",
            value: coordinates.lat,
            key: "lat",
            disabled: true,
            inputWidth: "100%",
          },
          {
            name: "Longitude",
            type: "text",
            value: coordinates.lng,
            key: "lng",
            disabled: true,
            inputWidth: "100%",
          },
        ]}
        title="Create Proposal"
        disabled={loading}
        buttonConfig={{
          isLoading: loading,
          loadingText: "Submitting",
          text: "Submit",
          theme: "primary",
        }}
      />
      {loading && <p>Submitting proposal...</p>}
      {message && <p>{message}</p>}
    </div>
  );
};

export default ProposalForm;

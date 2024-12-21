import { useEffect, useState } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { ethers } from "ethers";
import pinToIPFS from "../../utils/pinToIPFS";
import {
  abiProposalContract,
  contractAddressesProposalContract,
  abiGovernor,
  contractAddressesGovernor,
  abiGovernanceToken,
  contractAddressesGovernanceToken,
} from "../../constants";
import CategoryEnums from "../../constants/categoryEnums";
import categoryMapping from "../../constants/categoryMapping";
import { SCALING_FACTOR } from "../../constants/variables";
import { useNotification, Form } from "web3uikit";
import Spinner from "../Spinner/Spinner";
import axios from "axios";
import dotenv from "dotenv";
import styles from "../../styles/ProposalForm.module.css";

dotenv.config();

const ProposalForm = ({ onProposalSubmit, coordinates }) => {
  const { isWeb3Enabled, chainId: chainIdHex, account } = useMoralis();
  const chainId = parseInt(chainIdHex, 16);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [canPropose, setCanPropose] = useState(false);
  const [loading, setLoading] = useState(false);
  const [proposalThreshold, setProposalThreshold] = useState(null);

  const governorAddress =
    chainId in contractAddressesGovernor ? contractAddressesGovernor[chainId][0] : null;
  const governanceTokenAddress =
    chainId in contractAddressesGovernanceToken
      ? contractAddressesGovernanceToken[chainId][0]
      : null;
  const proposalContractAddress =
    chainId in contractAddressesProposalContract
      ? contractAddressesProposalContract[chainId][0]
      : null;

  const dispatch = useNotification();
  const { runContractFunction } = useWeb3Contract();

  // Check if the user is eligible to create a proposal
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

      console.log("Threshold:", threshold.toString());

      setProposalThreshold(threshold);
      setCanPropose(ethers.BigNumber.from(votingPower).gte(threshold));
    } catch (error) {
      console.error("Error checking proposal eligibility:", error);
    }
  }

  // Create a new proposal
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

      const title = data.data[0].inputResult;
      const description = data.data[1].inputResult;

      const lat = ethers.BigNumber.from((coordinates.lat * SCALING_FACTOR).toFixed(0));
      const lng = ethers.BigNumber.from((coordinates.lng * SCALING_FACTOR).toFixed(0));

      const categoryString = data.data[2].inputResult;
      const normalizedCategoryString = categoryString.trim().toLowerCase();

      const normalizedCategoryMapping = Object.fromEntries(
        Object.entries(categoryMapping).map(([key, value]) => [key.toLowerCase(), value])
      );

      const category = normalizedCategoryMapping[normalizedCategoryString];

      if (isNaN(category)) {
        throw new Error("Invalid category selected.");
      }
      const proposalData = {
        title,
        description,
        coordinates: { lat: coordinates.lat, lng: coordinates.lng },
        category,
      };

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
      const args = [title, description, lat, lng, account, ipfsHash, category];
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
      dispatch({
        type: "error",
        message: "Error creating proposal: " + error.message,
        title: "Transaction Notification",
        position: "topR",
      });
    } finally {
      setLoading(false);
    }
  }

  // Handle successful proposal creation
  const handleSuccess = async (tx, proposalData) => {
    try {
      const proposalReceipt = await tx.wait(1);
      const proposalId = proposalReceipt.events[0].args.proposalId.toString();
      const proposer = account;

      proposalData = { ...proposalData, proposalId, proposer };

      if (chainId === 31337) {
        await axios.post("http://localhost:5000/proposals", { ...proposalData });
      }

      await fetchProposalDetails(proposalId);
      setMessage("Proposal submitted successfully on the blockchain and saved to backend!");

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
      dispatch({
        type: "error",
        message: "Failed to save proposal. Please check the console for details.",
        title: "Transaction Notification",
        position: "topR",
      });
    }
  };

  // Fetch proposal details from the blockchain
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

      console.log("Proposal State:", proposalState);
      console.log("Proposal Snapshot (Block Number):", proposalSnapshot.toString());
      console.log("Proposal Deadline (Block Number):", proposalDeadline.toString());
    } catch (error) {
      console.error("Error fetching proposal details:", error);
    }
  };

  // Handle errors during proposal submission
  const handleError = (error) => {
    console.error("Proposal submission error:", error);
    setMessage("Proposal submission failed. Please see console for details.");
    setLoading(false);
    dispatch({
      type: "error",
      message: "Proposal submission failed. Please see console for details.",
      title: "Transaction Notification",
      position: "topR",
    });
  };

  // Update UI based on Web3 status
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
          {
            name: "Title",
            type: "text",
            value: title,
            key: "title",
            inputWidth: "100%",
            validation: { required: true },
            placeholder: "Enter proposal title",
            onChange: (e) => setTitle(e.target.value),
          },
          {
            name: "Description",
            type: "text",
            value: description,
            key: "description",
            inputWidth: "100%",
            validation: { required: true },
            placeholder: "Enter proposal description",
            onChange: (e) => setDescription(e.target.value),
          },
          {
            name: "Category",
            type: "select",
            value: "",
            key: "category",
            inputWidth: "100%",
            selectOptions: [
              { value: "", label: "Select a category" },
              ...Object.values(CategoryEnums).map((value) => ({
                value: value,
                label: value.charAt(0) + value.slice(1).toLowerCase(),
              })),
            ],
          },
          {
            name: "Latitude",
            type: "text",
            value: coordinates.lat,
            key: "lat",
            inputWidth: "100%",
            disabled: true,
          },
          {
            name: "Longitude",
            type: "text",
            value: coordinates.lng,
            key: "lng",
            inputWidth: "100%",
            disabled: true,
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
      {loading && (
        <div className={styles["loading-overlay"]}>
          <Spinner />
        </div>
      )}
      {message && <p>{message}</p>}
    </div>
  );
};

export default ProposalForm;

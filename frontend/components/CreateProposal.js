import { useEffect, useState } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { ethers } from "ethers";
import styles from "../styles/Home.module.css";
import {
  abiHazardProposal,
  contractAddressesHazard,
  abiGovernor,
  contractAddressesGovernor,
} from "../constants";
import { useNotification, Form } from "web3uikit";
import axios from "axios";

const Proposal = ({ onProposalSubmit, coordinates, setCoordinates }) => {
  const { isWeb3Enabled, chainId: chainIdHex } = useMoralis();
  const chainId = parseInt(chainIdHex);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // const [coordinates, setCoordinates] = useState({ lat: "", lng: "" });
  const [message, setMessage] = useState(""); // State for success/error messages

  useEffect(() => {
    setCoordinates(coordinates);
  }, [coordinates]);

  const governorAddress =
    chainId in contractAddressesGovernor ? contractAddressesGovernor[chainId][0] : null;

  const hazardAddress =
    chainId in contractAddressesHazard ? contractAddressesHazard[chainId][0] : null;

  const dispatch = useNotification();
  const { runContractFunction } = useWeb3Contract();

  async function createProposal(data) {
    console.log("Creating proposal...");
    const title = data.data[0].inputResult;
    const description = data.data[1].inputResult;
    const lat = ethers.BigNumber.from(parseFloat(coordinates.lat).toFixed(0));
    const lng = ethers.BigNumber.from(parseFloat(coordinates.lng).toFixed(0));

    const functionToCall = "storeHazard";
    const proposalInterface = new ethers.utils.Interface(abiHazardProposal);
    const args = [title, description, lat, lng];
    const proposalDescription = description;
    const encodedFunctionCall = proposalInterface.encodeFunctionData(functionToCall, args);

    const createProposalOptions = {
      abi: abiGovernor,
      contractAddress: governorAddress,
      functionName: "propose",
      params: {
        targets: [hazardAddress],
        values: [0],
        calldatas: [encodedFunctionCall],
        description: proposalDescription,
      },
    };

    await runContractFunction({
      params: createProposalOptions,
      onSuccess: (tx) => handleSuccess(tx),
      onError: (error) => handleError(error),
    });
  }

  const handleSuccess = async (tx) => {
    try {
      await tx.wait(1);
      setMessage("Proposal submitted successfully on the blockchain!");
      console.log("Success!");

      // Clear form fields
      const proposalData = {
        title,
        description,
        coordinates: {
          lat: coordinates.lat,
          lng: coordinates.lng,
        },
      };

      // Send the proposal data to the backend
      const response = await axios.post("http://localhost:5000/", proposalData);
      console.log("Proposal submitted:", response.data);

      setMessage("Proposal submitted successfully on the blockchain and saved to backend!");
      setTitle("");
      setDescription("");
      setCoordinates({ lat: "", lng: "" });
      dispatch({
        type: "success",
        message: "Proposal submitted successfully!",
        title: "Transaction Notification",
        position: "topR",
        icon: "bell",
      });
    } catch (error) {
      console.error("Error waiting for transaction or saving proposal:", error);
      setMessage("Failed to submit proposal or save data. Please try again.");
    }
  };

  const handleError = (error) => {
    console.error("Proposal error:", error);
    setMessage("Proposal submission failed. See console for details.");
  };

  async function updateUI() {
    // Update UI based on web3 connection
    if (isWeb3Enabled) {
      console.log("Web3 is enabled!");
    } else {
      console.log("Web3 is not enabled.");
    }
  }

  useEffect(() => {
    if (isWeb3Enabled) {
      updateUI();
    }
  }, [isWeb3Enabled]);

  return (
    <div className={styles["proposal-form"]}>
      <Form
        onSubmit={createProposal}
        data={[
          { name: "Title", type: "text", value: "Title", key: "title" },
          { name: "Description", type: "textarea", value: "Description", key: "description" },
          { name: "Latitude", type: "text", value: coordinates.lat, key: "lat" },
          { name: "Longitude", type: "text", value: coordinates.lng, key: "lng" },
        ]}
        title="Create Proposal"
      />
      {message && <p>{message}</p>}
    </div>
  );
};

export default Proposal;

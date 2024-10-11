import { useState } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis"; // useWeb3Contract is correctly imported here
import { ethers } from "ethers";
import styles from "../styles/Home.module.css";
import {
  abiHazardProposal,
  contractAddressesHazard,
  abiGovernor,
  contractAddressesGovernor,
} from "../constants";
import { useNotification, Form } from "web3uikit";

const Proposal = () => {
  const { isWeb3Enabled, chainId: chainIdHex } = useMoralis();
  const chainId = parseInt(chainIdHex);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coordinates, setCoordinates] = useState({ lat: "", lng: "" });
  const [message, setMessage] = useState(""); // State for success/error messages

  const governorAddress =
    chainId in contractAddressesGovernor ? contractAddressesGovernor[chainId][0] : null;

  const hazardAddress =
    chainId in contractAddressesHazard ? contractAddressesHazard[chainId][0] : null;

  const dispatch = useNotification();

  // const functionToCall = "storeHazard";
  // const proposalInterface = new ethers.utils.Interface(abiHazardProposal);
  // const args = [title, description, coordinates.lat, coordinates.lng];
  // const proposalDescription = description;
  // const encodedFunctionCall = proposalInterface.encodeFunctionData(functionToCall, args);

  // const { runContractFunction: propose } = useWeb3Contract({
  //   abi: abiGovernor,
  //   contractAddress: governorAddress,
  //   functionName: "propose",
  //   params: {
  //     targets: [hazardAddress],
  //     values: [0],
  //     calldatas: [encodedFunctionCall],
  //     description: proposalDescription,
  //   },
  // });

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setMessage(""); // Clear any previous messages

  //   if (!isWeb3Enabled) {
  //     setMessage("Please connect your wallet to submit a proposal.");
  //     return;
  //   }

  //   try {
  //     // Encode the function call for HazardProposal contract

  //     console.log(1, hazardAddress, 2, encodedFunctionCall, 3, proposalDescription, 4, args);
  //     // Run the propose function on the Governor contract
  //     await propose({
  //       params: {
  //         targets: [hazardAddress], // The address of the HazardProposal contract
  //         values: [0], // No ether is sent along
  //         calldatas: [encodedFunctionCall], // Encoded function data for the proposal
  //         description: proposalDescription,
  //       },
  //       onSuccess: (tx) => handleSuccess(tx),
  //       onError: (error) => handleError(error),
  //     });
  //   } catch (error) {
  //     console.error("Error encoding function call:", error);
  //     setMessage("Failed to encode proposal function call.");
  //   }
  // };

  // const handleSuccess = async (tx) => {
  //   try {
  //     await tx.wait(1);
  //     setMessage("Proposal submitted successfully on the blockchain!");
  //     handleNewNotification();
  //     // Clear form fields
  //     setTitle("");
  //     setDescription("");
  //     setCoordinates({ lat: "", lng: "" });
  //   } catch (error) {
  //     console.error("Error waiting for transaction:", error);
  //     setMessage("Failed to submit proposal. Please try again.");
  //   }
  // };

  const handleError = (error) => {
    console.error("Proposal error:", error);
    setMessage("Proposal submission failed. See console for details.");
  };

  const handleNewNotification = () => {
    dispatch({
      type: "success",
      message: "Proposal submitted successfully!",
      title: "Transaction Notification",
      position: "topR",
      icon: "bell",
    });
  };

  const { runContractFunction } = useWeb3Contract();

  async function createProposal(data) {
    console.log("Creating proposal...");
    const title = data.data[0].inputResult;
    const description = data.data[1].inputResult;
    const lat = ethers.BigNumber.from(parseFloat(data.data[2].inputResult).toFixed(0));
    const lng = ethers.BigNumber.from(parseFloat(data.data[3].inputResult).toFixed(0));

    console.log("Title:", title, "Description:", description, "Lat:", lat, "Lng:", lng);

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

  return (
    <div>
      <Form
        onSubmit={createProposal}
        data={[
          {
            name: "Title",
            type: "text",
            value: "",
            key: "title",
          },
          {
            name: "Description",
            type: "textarea",
            value: "",
            key: "description",
          },
          {
            name: "Latitude",
            type: "text",
            value: "",
            key: "lat",
          },
          {
            name: "Longitude",
            type: "text",
            value: "",
            key: "lng",
          },
        ]}
        title="Create Proposal"
        id="proposal-form"
      ></Form>
    </div>
  );

  // return (
  //   <form onSubmit={handleSubmit} className={styles["form-container"]}>
  //     <label>Title</label>
  //     <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />

  //     <label>Description</label>
  //     <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />

  //     <label>Latitude</label>
  //     <input
  //       type="text"
  //       value={coordinates.lat}
  //       onChange={(e) => setCoordinates({ ...coordinates, lat: e.target.value })}
  //       required
  //     />

  //     <label>Longitude</label>
  //     <input
  //       type="text"
  //       value={coordinates.lng}
  //       onChange={(e) => setCoordinates({ ...coordinates, lng: e.target.value })}
  //       required
  //     />

  //     <button type="submit">Submit Proposal</button>

  //     {/* Display success or error message */}
  //     {message && <p>{message}</p>}
  //   </form>
  // );
};

export default Proposal;

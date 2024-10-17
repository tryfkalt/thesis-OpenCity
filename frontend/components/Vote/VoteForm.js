import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { useNotification, Radios, Input, Button } from "web3uikit";
import { abiGovernor, contractAddressesGovernor } from "../../constants";

const VoteForm = ({ proposalDetails }) => {
  const router = useRouter();
  const dispatch = useNotification(); 

  const proposalId = proposalDetails?.proposalId || router.query.proposalId;
  const { isWeb3Enabled, chainId: chainIdHex } = useMoralis();
  const chainId = parseInt(chainIdHex, 16);

  const [vote, setVote] = useState(null);
  const [reason, setReason] = useState("");
  const [isVoting, setIsVoting] = useState(false);

  const governorAddress = chainId in contractAddressesGovernor ? contractAddressesGovernor[chainId][0] : null;

  const { runContractFunction } = useWeb3Contract();

  const handleVoteChange = (event) => {
    const selectedVote = event.target.value;
    setVote(selectedVote === "Yes" ? 1 : selectedVote === "No" ? 0 : 2);
  };

  const handleReasonChange = (event) => setReason(event.target.value);

  async function voteProposal() {
    if (!proposalId) {
      dispatch({
        type: "error",
        message: "Proposal ID is missing from URL.",
        title: "Error",
        position: "topR",
      });
      return;
    }

    if (vote === null) {
      dispatch({ type: "error", message: "Please select a vote option.", title: "No Vote Selected", position: "topR" });
      return;
    }

    if (!isWeb3Enabled || !governorAddress) {
      dispatch({ type: "error", message: "Web3 is not enabled or address is missing.", title: "Error", position: "topR" });
      return;
    }

    setIsVoting(true);
    const voteProposalOptions = {
      abi: abiGovernor,
      contractAddress: governorAddress,
      functionName: "castVoteWithReason",
      params: {
        proposalId: proposalId,
        support: vote,
        reason: reason,
      },
    };

    try {
      await runContractFunction({
        params: voteProposalOptions,
        onSuccess: (tx) => handleSuccess(tx),
        onError: handleError,
      });
    } catch (error) {
      handleError(error);
    } finally {
      setIsVoting(false);
    }
  }

  const handleSuccess = async (tx) => {
    await tx.wait(1);
    dispatch({
      type: "success",
      message: "Vote submitted successfully.",
      title: "Vote Cast",
      position: "topR",
    });

    try {
      const proposalState = await runContractFunction({
        abi: abiGovernor,
        contractAddress: governorAddress,
        functionName: "state",
        params: { proposalId },
      });
      console.log("Proposal state:", proposalState);
    } catch (error) {
      console.error("Error fetching proposal state:", error);
      dispatch({
        type: "error",
        message: "Error fetching proposal state after voting.",
        title: "State Fetch Error",
        position: "topR",
      });
    }
  };

  const handleError = (error) => {
    console.error("Error voting on proposal:", error);
    dispatch({
      type: "error",
      message: error?.message || "An unknown error occurred while voting.",
      title: "Vote Failed",
      position: "topR",
    });
  };

  useEffect(() => {
    if (isWeb3Enabled) {
      console.log("Web3 is enabled!");
    } else {
      console.log("Web3 is not enabled.");
    }
  }, [isWeb3Enabled]);

  return (
    <div>
      <h3>Cast your vote</h3>
      <Radios
        id="radios"
        items={["No", "Yes", "Abstain"]}
        onChange={handleVoteChange}
        title="Do you agree with this proposal?"
      />

      <Input
        label="State your reason"
        value={reason}
        onChange={handleReasonChange}
        placeholder="Explain why you are voting this way..."
        textarea
      />

      <Button
        onClick={voteProposal}
        text={isVoting ? "Submitting..." : "Submit Vote"}
        disabled={isVoting}
      />
    </div>
  );
};

export default VoteForm;

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { useNotification, Radios, Input, Button, TextArea } from "web3uikit";
import Spinner from "../Spinner/Spinner";
import {
  abiGovernor,
  contractAddressesGovernor,
  contractAddressesGovernanceToken,
  abiGovernanceToken,
} from "../../constants";
import styles from "../../styles/VoteForm.module.css";

const VoteForm = ({ proposalDetails, onVoteSubmit }) => {
  const router = useRouter();
  const dispatch = useNotification();

  const proposalId = proposalDetails?.proposalId || router.query.proposalId;

  const { isWeb3Enabled, chainId: chainIdHex, account } = useMoralis();
  const chainId = parseInt(chainIdHex, 16);

  const proposer = proposalDetails?.proposer;
  const isProposer = proposer === account;

  const [vote, setVote] = useState(null);
  const [reason, setReason] = useState("");
  const [isVoting, setIsVoting] = useState(false);
  const [voterPower, setVoterPower] = useState(null); // To store the voting power
  const [snapshotBlock, setSnapshotBlock] = useState(null); // To store the snapshot block
  const [votingPower, setVotingPower] = useState("0");
  const [loading, setLoading] = useState(false);

  const governorAddress =
    chainId in contractAddressesGovernor ? contractAddressesGovernor[chainId][0] : null;

  const governanceTokenAddress =
    chainId in contractAddressesGovernanceToken
      ? contractAddressesGovernanceToken[chainId][0]
      : null;

  const { runContractFunction } = useWeb3Contract();

  const handleVoteChange = (event) => {
    const selectedVote = parseInt(event.target.value, 10); // Ensure it's an integer
    setVote(selectedVote);
  };

  const handleReasonChange = (event) => setReason(event.target.value);

  const voteProposal = useCallback(async () => {
    if (!proposalId) {
      dispatch({
        type: "error",
        message: "Proposal ID is missing from URL.",
        title: "Error",
        position: "topR",
      });
      return;
    }
    if (voterPower === "0" || voterPower === null) {
      dispatch({
        type: "error",
        message: "You have zero voting power and cannot vote on this proposal.",
        title: "No Voting Power",
        position: "topR",
      });
      return;
    }
    if (vote === null) {
      dispatch({
        type: "error",
        message: "Please select a vote option.",
        title: "No Vote Selected",
        position: "topR",
      });
      return;
    }

    if (!isWeb3Enabled || !governorAddress) {
      dispatch({
        type: "error",
        message: "Web3 is not enabled or address is missing.",
        title: "Error",
        position: "topR",
      });
      return;
    }
    setLoading(true);
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
    console.log("Voting on proposal with options:", voteProposalOptions);
    try {
      await runContractFunction({
        params: voteProposalOptions,
        onSuccess: (tx) => handleSuccess(tx),
        onError: handleError,
      });
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
      setIsVoting(false);
    }
  }, [vote, proposalId, isWeb3Enabled, governorAddress, reason]);

  const handleSuccess = async (tx) => {
    await tx.wait(1);
    const proposalVotesOptions = {
      abi: abiGovernor,
      contractAddress: governorAddress,
      functionName: "proposalVotes",
      params: { proposalId },
    };
    const proposalVotes = await runContractFunction({ params: proposalVotesOptions });
    console.log(`Votes For: ${proposalVotes.forVotes.toString()}`);
    console.log(`Votes Against: ${proposalVotes.againstVotes.toString()}`);
    console.log(`Abstain Votes: ${proposalVotes.abstainVotes.toString()}`);
    await fetchInfo();
    dispatch({
      type: "success",
      message: "Vote submitted successfully.",
      title: "Vote Cast",
      position: "topR",
    });
  };

  const fetchInfo = async () => {
    console.log("ProposalID:", proposalId);
    try {
      const stateOptions = {
        abi: abiGovernor,
        contractAddress: governorAddress,
        functionName: "state",
        params: { proposalId },
      };
      const proposalState = await runContractFunction({ params: stateOptions });
      console.log("Proposal state:", proposalState);

      // Get proposal snapshot block
      const snapshotOptions = {
        abi: abiGovernor,
        contractAddress: governorAddress,
        functionName: "proposalSnapshot",
        params: { proposalId },
      };
      const snapshotBlock = await runContractFunction({ params: snapshotOptions });
      setSnapshotBlock(snapshotBlock);
      console.log("Proposal snapshot block:", snapshotBlock.toString());

      // Get voter power at snapshot block
      const voterPowerOptions = {
        abi: abiGovernor,
        contractAddress: governorAddress,
        functionName: "getVotes",
        params: { account: account, blockNumber: snapshotBlock },
      };
      const power = await runContractFunction({ params: voterPowerOptions });
      setVoterPower(power.toString());

      const quorumOptions = {
        abi: abiGovernor,
        contractAddress: governorAddress,
        functionName: "quorum",
        params: { blockNumber: snapshotBlock },
      };
      // const quorumRequired = await governor.quorum(proposalSnapshot);

      const quorumRequired = await runContractFunction({ params: quorumOptions });
      console.log(`Quorum required at block ${snapshotBlock}: ${quorumRequired.toString()}`);

      const votingPeriodOptions = {
        abi: abiGovernor,
        contractAddress: governorAddress,
        functionName: "votingPeriod",
        params: { blockNumber: snapshotBlock },
      };

      const votingPeriod = await runContractFunction({ params: votingPeriodOptions });
      console.log(`Voting period at block ${snapshotBlock}: ${votingPeriod.toString()}`);
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
    const errorMessage = error?.message || "An unknown error occurred while voting.";
    dispatch({
      type: "error",
      message: errorMessage || "An unknown error occurred while voting.",
      title: "Vote Failed",
      position: "topR",
    });
  };

  const fetchVotingPower = async () => {
    const balanceOptions = {
      abi: abiGovernanceToken,
      contractAddress: governanceTokenAddress,
      functionName: "balanceOf",
      params: {
        account: account,
      },
    };

    try {
      const balance = await runContractFunction({ params: balanceOptions });
    } catch (error) {
      console.error("Error fetching token balance: ", error);
    }

    const delegateOptions = {
      abi: abiGovernanceToken,
      contractAddress: governanceTokenAddress,
      functionName: "delegates",
      params: {
        account: account,
      },
    };

    try {
      const delegatee = await runContractFunction({ params: delegateOptions });
    } catch (error) {
      console.error("Error fetching delegatee: ", error);
    }
    try {
      const votingPowerOptions = {
        abi: abiGovernanceToken,
        contractAddress: governanceTokenAddress,
        functionName: "getVotes",
        params: {
          account: account,
        },
      };

      const votes = await runContractFunction({ params: votingPowerOptions });
      setVotingPower(votes.toString());
    } catch (error) {
      console.error("Error fetching voting power: ", error);
    }
  };
  const handleGetVotes = () => {
    fetchVotingPower();
  };
  // Fetch voter's power when component mounts and when isWeb3Enabled is true
  useEffect(() => {
    if (isWeb3Enabled) {
      fetchInfo();
      console.log("Web3 is enabled.");
    }
  }, [isWeb3Enabled]);

  // Expose voteProposal to the parent through useEffect
  useEffect(() => {
    if (onVoteSubmit) {
      onVoteSubmit(voteProposal); // Pass the function itself
    }
  }, [onVoteSubmit, voteProposal]); // Run only when onVoteSubmit is available

  return (
    <div className={styles.voteForm}>
      <h3 className={styles.voteFormHeader}>Cast your vote</h3>
      <p className={styles.voteFormPower}>
        Voting power at snapshot: {voterPower || "Loading..."} TT
      </p>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Button
          onClick={handleGetVotes}
          text="Get Voting Power"
          theme="secondary"
          style={{
            padding: "10px 15px",
            fontSize: "14px",
            marginBottom: "24px",
            marginLeft: "20px",
            color: "#fff",
            backgroundColor: "#68738d",
            border: "none",
            cursor: "pointer",
            borderRadius: "8px",
            boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.2)",
            transition: "background-color 0.3s ease",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#5a6278")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#68738d")}
          onMouseDown={(e) => (e.target.style.backgroundColor = "#4e5568")}
          onMouseUp={(e) => (e.target.style.backgroundColor = "#5a6278")}
        />
      </div>
      {!isProposer ? (
        <>
          <div className={styles.voteFormRadios}>
            <Radios
              id="radios"
              items={["No", "Yes", "Abstain"]}
              onChange={handleVoteChange}
              title="Do you agree with this proposal?"
            />
          </div>

          <TextArea
            label="State your reason"
            value={reason}
            onChange={handleReasonChange}
            placeholder="Explain why you are voting this way..."
            width="100%"
            style={{
              width: "100%",
              height: "50px",
              padding: "12px",
              fontSize: "14px",
            }}
            validation={{ required: true }}
          />
        </>
      ) : (
        <p className={styles.voteFormError}>You cannot vote on your own proposal.</p>
      )}
    </div>
  );
};

export default VoteForm;

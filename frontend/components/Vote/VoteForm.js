import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { useNotification, Radios, Input, Button } from "web3uikit";
import {
  abiGovernor,
  contractAddressesGovernor,
  contractAddressesGovernanceToken,
  abiGovernanceToken,
} from "../../constants";

const VoteForm = ({ proposalDetails }) => {
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
    console.log("Selected vote:", selectedVote); // Should log 0, 1, or 2 directly
};


  const handleReasonChange = (event) => setReason(event.target.value);

  async function voteProposal() {
    console.log("Vote when submitting", vote);
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

    setIsVoting(true);
    console.log("Before vote:", vote)
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
      setIsVoting(false);
    }
  }

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
      console.log("Proposal snapshot block:", snapshotBlock);

      // Get voter power at snapshot block
      const voterPowerOptions = {
        abi: abiGovernor,
        contractAddress: governorAddress,
        functionName: "getVotes",
        params: { account: account, blockNumber: snapshotBlock },
      };
      const power = await runContractFunction({ params: voterPowerOptions });
      setVoterPower(power.toString());
      console.log(`Voter ${account} has ${power.toString()} votes at block ${snapshotBlock}.`);

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
    dispatch({
      type: "error",
      message: error?.message || "An unknown error occurred while voting.",
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
      console.log("Token balance:", balance.toString());
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
      console.log("Delegatee:", delegatee);
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
      console.log("votes", votes.toString());
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

  return (
    <div>
      <h3>Cast your vote</h3>
      <p>Voting power at snapshot: {voterPower ? voterPower : "Loading..."}</p>
      <Button onClick={handleGetVotes} text="Get Voting Power" />
      {/* Disable voting if the user is the proposer */}
      {isProposer ? (
        <p>You cannot vote on your own proposal.</p>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default VoteForm;

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useMoralis, useWeb3Contract } from "react-moralis";
import axios from "axios";
import { abiGovernor, contractAddressesGovernor } from "../../constants";
import Header from "../../components/Header";
import Map from "../../components/Map";
import QueueProposal from "../../components/Queue-Execute/QueueProposal";
import ExecuteProposal from "../../components/Queue-Execute/ExecuteProposal";
import { Button } from "web3uikit";
import styles from "../../styles/Proposal.module.css";

const ProposalDetails = () => {
  const { query } = useRouter();
  const { id: proposalId } = query;
  const { isWeb3Enabled, chainId: chainIdHex, account } = useMoralis();
  const chainId = parseInt(chainIdHex, 16);

  const [proposal, setProposal] = useState(null);
  const [status, setStatus] = useState("");
  const [quorum, setQuorum] = useState(null); // New state for quorum
  const [canQueue, setCanQueue] = useState(false);
  const [canExecute, setCanExecute] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState({ lat: "", lng: "" });
  const [showDefaultMarker, setShowDefaultMarker] = useState(false);
  const [votes, setVotes] = useState({ for: 0, against: 0, abstain: 0 });
  const [majoritySupport, setMajoritySupport] = useState("");

  const { runContractFunction } = useWeb3Contract();

  useEffect(() => {
    if (isWeb3Enabled && proposalId) {
      fetchProposalDetails(proposalId);
    }
  }, [isWeb3Enabled, proposalId]);

  const fetchProposalDetails = async (id) => {
    try {
      const response = await axios.get(`http://localhost:5000/proposals/${id}`);
      setProposal(response.data);
      setSelectedCoords(response.data.coordinates);

      const governorAddress = contractAddressesGovernor[chainId]?.[0];
      const stateOptions = {
        abi: abiGovernor,
        contractAddress: governorAddress,
        functionName: "state",
        params: { proposalId: id },
      };
      const snapshotOptions = {
        abi: abiGovernor,
        contractAddress: governorAddress,
        functionName: "proposalSnapshot",
        params: { proposalId: id },
      };
      const proposalState = await runContractFunction({ params: stateOptions });
      setStatus(getStatusText(proposalState));

      if (status !== "Pending") {
        const proposalSnapshot = await runContractFunction({ params: snapshotOptions });
        const quorumOptions = {
          abi: abiGovernor,
          contractAddress: governorAddress,
          functionName: "quorum",
          params: { blockNumber: proposalSnapshot },
        };
        const proposalQuorum = await runContractFunction({ params: quorumOptions });

        setQuorum(proposalQuorum.toString()); // Save quorum to state
      }

      // Set queue and execute eligibility based on proposal state and proposer
      setCanQueue(account === response.data.proposer && proposalState === 4); // Succeeded
      setCanExecute(account === response.data.proposer && proposalState === 5); // Queued
      fetchVotes(id);
    } catch (error) {
      console.error("Error fetching proposal details:", error);
    }
  };

  const fetchVotes = async (id) => {
    try {
      const governorAddress = contractAddressesGovernor[chainId]?.[0];
      const voteOptions = {
        abi: abiGovernor,
        contractAddress: governorAddress,
        functionName: "proposalVotes",
        params: { proposalId: id },
      };

      const voteCounts = await runContractFunction({ params: voteOptions });
      const forVotes = parseInt(voteCounts.forVotes.toString());
      const againstVotes = parseInt(voteCounts.againstVotes.toString());
      const abstainVotes = parseInt(voteCounts.abstainVotes.toString());

      setVotes({ for: forVotes, against: againstVotes, abstain: abstainVotes });
      setMajoritySupport(forVotes > againstVotes ? "Yes" : "No");
    } catch (error) {
      console.error("Error fetching vote counts:", error);
    }
  };

  const getStatusText = (state) => {
    switch (state) {
      case 0:
        return "Pending";
      case 1:
        return "Active";
      case 2:
        return "Canceled";
      case 3:
        return "Defeated";
      case 4:
        return "Succeeded";
      case 5:
        return "Queued";
      case 6:
        return "Expired";
      case 7:
        return "Executed";
      default:
        return "Unknown";
    }
  };

  return (
    <div className={styles.container}>
      <Header />
      {proposal ? (
        <>
          <h2 className={styles.headerTitle}>Proposal Details</h2>
          <div className={styles.proposalDetails}>
            <p>Title: {proposal.title}</p>
            <p>Description: {proposal.description}</p>
            <p>Status: {status}</p>
            <p>Coordinates: {`${proposal.coordinates.lat}, ${proposal.coordinates.lng}`}</p>
            <p>Proposer: {proposal.proposer}</p>
            {status != "Pending" ? (
              <p>
                Quorum: {votes.for} out of {quorum}
              </p>
            ) : null}
          </div>

          <h3 className={styles.subHeaderTitle}>Vote Statistics</h3>
          <div className={styles.voteStats}>
            <div>
              <h4 className={styles.voteStatsTitle}>For</h4>
              <p className={styles.voteStatsText}>{votes.for}</p>
            </div>
            <div>
              <h4 className={styles.voteStatsTitle}>Against</h4>
              <p className={styles.voteStatsText}>{votes.against}</p>
            </div>
            <div>
              <h4 className={styles.voteStatsTitle}>Abstain</h4>
              <p className={styles.voteStatsText}>{votes.abstain}</p>
            </div>
          </div>
          <p>Majority Support: {majoritySupport === "Yes" ? "Yes" : "No"}</p>

          {/* {status === "Active" && (
            <div className={styles.voteButton}>
              <Button text="Vote on proposal" theme="primary" onClick={() => {}} />
            </div>
          )} */}

          {canQueue && (
            <div className={styles.queueExecute}>
              <QueueProposal proposalDetails={proposal} />
            </div>
          )}

          {canExecute && (
            <div className={styles.queueExecute}>
              <ExecuteProposal proposalDetails={proposal} />
            </div>
          )}

          <div className={styles.mapContainer}>
            <Map
              // markers={[proposal]}
              onMapClick={setSelectedCoords}
              proposalStatus={status}
            />
          </div>
        </>
      ) : (
        <p>Loading proposal details...</p>
      )}
    </div>
  );
};

export default ProposalDetails;

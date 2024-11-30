import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { useQuery, gql } from "@apollo/client";
import axios from "axios";
import {
  abiGovernor,
  contractAddressesGovernor,
  abiGovernanceToken,
  contractAddressesGovernanceToken,
} from "../../constants";
import Header from "../../components/Header";
import Map from "../../components/Map";
import QueueProposal from "../../components/Queue-Execute/QueueProposal";
import ExecuteProposal from "../../components/Queue-Execute/ExecuteProposal";
import { Button } from "web3uikit";
import styles from "../../styles/Proposal.module.css";
import { GET_PROPOSAL_BY_ID } from "../../constants/subgraphQueries";

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
  const [participationRate, setParticipationRate] = useState(0);
  const { runContractFunction } = useWeb3Contract();

  const {
    loading,
    error,
    data: proposalFromGraph,
  } = useQuery(GET_PROPOSAL_BY_ID, {
    variables: { proposalId: proposalId },
  });

  // console.log(proposalFromGraph);
  if (chainId === 31337) {
    useEffect(() => {
      const fetchProposalDetails = async (id) => {
        try {
          const response = await axios.get(`http://localhost:5000/proposals/${id}`);
          console.log("RESPONSE", response.data);
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
      if (isWeb3Enabled && proposalId) {
        fetchProposalDetails(proposalId);
      }
    }, [isWeb3Enabled, proposalId]);
  } else {
    useEffect(() => {
      const fetchProposalDetails = async () => {
        try {
          console.log("ProposalsGraph:", proposalFromGraph);

          // Extract IPFS hash from description
          const extractIpfsHash = (description) => {
            const parts = description.split("#");
            return parts.length > 1 ? parts[1] : null;
          };
          const ipfsHash = extractIpfsHash(proposalFromGraph.proposalCreateds[0]?.description); // Access the first proposal
          if (!ipfsHash) {
            console.error("No IPFS hash found in the proposal description.");
            return;
          }

          // Fetch proposal data from IPFS
          const ipfsResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
          console.log("IPFS DATA", { ...ipfsResponse.data, ipfsHash });
          setProposal({ ...ipfsResponse.data, ipfsHash });
          setSelectedCoords(ipfsResponse.data.coordinates);
          // Fetch proposal state
          const governorAddress = contractAddressesGovernor[chainId]?.[0];
          if (!governorAddress) {
            console.error("Governor address not found for the current chain.");
            return;
          }

          const stateOptions = {
            abi: abiGovernor,
            contractAddress: governorAddress,
            functionName: "state",
            params: { proposalId },
          };
          const proposalState = await runContractFunction({ params: stateOptions });
          const proposalStatus = getStatusText(proposalState);
          setStatus(proposalStatus);

          // If not pending, fetch additional details
          if (proposalStatus !== "Pending") {
            const snapshotOptions = {
              abi: abiGovernor,
              contractAddress: governorAddress,
              functionName: "proposalSnapshot",
              params: { proposalId },
            };
            const proposalSnapshot = await runContractFunction({ params: snapshotOptions });

            const quorumOptions = {
              abi: abiGovernor,
              contractAddress: governorAddress,
              functionName: "quorum",
              params: { blockNumber: proposalSnapshot },
            };
            const proposalQuorum = await runContractFunction({ params: quorumOptions });
            setQuorum(proposalQuorum.toString());
          }

          // Check queue and execute eligibility
          setCanQueue(
            account === proposalFromGraph.proposalCreateds[0]?.proposer && proposalState === 4
          ); // Succeeded
          setCanExecute(
            account === proposalFromGraph.proposalCreateds[0]?.proposer && proposalState === 5
          ); // Queued

          // Fetch votes
          fetchVotes(proposalId);
        } catch (error) {
          console.error("Error fetching proposal details:", error);
        }
      };

      if (isWeb3Enabled && proposalId && proposalFromGraph) {
        fetchProposalDetails();
      }
    }, [isWeb3Enabled, proposalId, proposalFromGraph, chainId]);
  }

  const fetchVotes = async (id) => {
    try {
      const governorAddress = contractAddressesGovernor[chainId]?.[0];
      const voteOptions = {
        abi: abiGovernor,
        contractAddress: governorAddress,
        functionName: "proposalVotes",
        params: { proposalId: id },
      };

      const governanceTokenAddress = contractAddressesGovernanceToken[chainId]?.[0];

      const totalSupplyOptions = {
        abi: abiGovernanceToken,
        contractAddress: governanceTokenAddress,
        functionName: "totalSupply",
        params: {},
      };

      const totalSupply = await runContractFunction({ params: totalSupplyOptions });
      const totalSupplyInt = parseInt(totalSupply.toString());
      console.log("Total supply:", totalSupplyInt);

      const voteCounts = await runContractFunction({ params: voteOptions });
      const forVotes = parseInt(voteCounts.forVotes.toString());
      const againstVotes = parseInt(voteCounts.againstVotes.toString());
      const abstainVotes = parseInt(voteCounts.abstainVotes.toString());

      const votesCast = forVotes + againstVotes + abstainVotes;
      const participationRate = (votesCast / totalSupplyInt) * 100;

      setParticipationRate(participationRate);
      setVotes({ for: forVotes, against: againstVotes, abstain: abstainVotes });
      setMajoritySupport(forVotes > againstVotes ? "Yes" : "No");
    } catch (error) {
      console.error("Error fetching vote counts:", error);
    }
  };

  // Helper functions
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
            <p className={styles.proposalTitle}>Title: {proposal.title}</p>
            <p className={styles.proposalDescription}>Description: {proposal.description}</p>
            <p className={styles.proposalCoords}>
              Coordinates: {`${proposal.coordinates.lat}, ${proposal.coordinates.lng}`}
            </p>
            <p
              className={`${styles.proposalStatus} ${
                status === "Pending"
                  ? styles.statusPending
                  : status === "Active"
                  ? styles.statusActive
                  : status === "Succeeded"
                  ? styles.statusSucceeded
                  : status === "Defeated"
                  ? styles.statusDefeated
                  : status === "Queued"
                  ? styles.statusQueued
                  : status === "Executed"
                  ? styles.statusExecuted
                  : ""
              }`}
            >
              Status: {status}
            </p>
            <p className={styles.proposalProposer}>Proposer: {proposal.proposer}</p>
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
          <div className={styles.supportContainer}>
            <p
              className={`${styles.proposalSupport} ${
                majoritySupport === "Yes" ? styles.supportYes : styles.supportNo
              }`}
            >
              Majority Support: {majoritySupport === "Yes" ? "Yes" : "No"}
            </p>
          </div>
          <h3 className={styles.subHeaderTitle}>Participation Rate</h3>
          <div className={styles.participationRateContainer}>
            <div className={styles.participationRateText}>
              <span>{participationRate}%</span>
              {/* <span>{votesCast.toLocaleString()} votes cast</span> */}
            </div>
            <div className={styles.progressBarBackground}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${participationRate}%` }}
              ></div>
            </div>
            <p className={styles.participationLabel}>Participation rate</p>
          </div>

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
            {proposal !== null && proposal.coordinates && (
              <Map
                // markers={[proposal]}
                onMapClick={setSelectedCoords}
                proposalStatus={status}
                idCoords={{ lat: proposal.coordinates.lat, lng: proposal.coordinates.lng }}
              />
            )}
          </div>
        </>
      ) : (
        <p>Loading proposal details...</p>
      )}
    </div>
  );
};

export default ProposalDetails;

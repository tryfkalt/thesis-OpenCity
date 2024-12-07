import { useEffect, useState } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import axios from "axios";
import { ethers } from "ethers";
import { useQuery } from "@apollo/client";
import { Table, Avatar, Tag, Button } from "web3uikit";
import {
  abiGovernor,
  contractAddressesGovernor,
  abiProposalContract,
  contractAddressesProposalContract,
} from "../constants";
import Header from "../components/Header";
import Spinner from "../components/Spinner/Spinner";
import styles from "../styles/ProposalsPage.module.css";
import { useRouter } from "next/router";
import { GET_PROPOSALS, GET_EXECUTED_PROPOSALS } from "../constants/subgraphQueries";

const ProposalsPage = () => {
  const { isWeb3Enabled, chainId: chainIdHex, account } = useMoralis();
  const chainId = parseInt(chainIdHex, 16);
  const [proposals, setProposals] = useState([]);
  const [executedProposals, setExecutedProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const { runContractFunction } = useWeb3Contract();
  const router = useRouter();

  const governorAddress =
    chainId in contractAddressesGovernor ? contractAddressesGovernor[chainId][0] : null;

  const proposalContractAddress =
    chainId in contractAddressesProposalContract
      ? contractAddressesProposalContract[chainId][0]
      : null;

  const SCALING_FACTOR = ethers.BigNumber.from(1e6);

  const { error, data: proposalsFromGraph } = useQuery(GET_PROPOSALS);
  const { data: executedProposalsFromGraph } = useQuery(GET_EXECUTED_PROPOSALS);

  if (chainId === 31337) {
    useEffect(() => {
      const fetchProposalsMetadata = async () => {
        try {
          setLoading(true);
          const metadataResponse = await axios.get("http://localhost:5000/proposals");
          const metadata = metadataResponse.data;
          const proposalDetails = await Promise.all(
            metadata.map(async (proposal) => {
              const ipfsResponse = await axios.get(
                `https://gateway.pinata.cloud/ipfs/${proposal.ipfsHash}`
              );
              const stateOptions = {
                abi: abiGovernor,
                contractAddress: governorAddress,
                functionName: "state",
                params: { proposalId: proposal.proposalId },
              };

              let proposalState;
              await runContractFunction({
                params: stateOptions,
                onSuccess: (state) => (proposalState = state),
                onError: (error) => console.error("Error fetching proposal state:", error),
              });

              const status = getStatusText(proposalState);
              return { ...proposal, ...ipfsResponse.data, status };
            })
          );
          setProposals(proposalDetails);
        } catch (error) {
          console.error("Error fetching proposals:", error);
        } finally {
          setLoading(false);
        }
      };
      const fetchExecutedProposals = async () => {
        try {
          setLoading(true);

          // Fetch proposals from the smart contract
          const executedProposalsOptions = {
            abi: abiProposalContract,
            contractAddress: proposalContractAddress,
            functionName: "getAllProposals",
            params: {},
          };

          const rawProposals = await runContractFunction({
            params: executedProposalsOptions,
            onSuccess: (proposals) => proposals,
            onError: (error) => {
              console.error("Error fetching executed proposals:", error);
              setLoading(false);
              return [];
            },
          });

          // Convert proposals to a more readable format
          const convertedProposals = rawProposals.map((proposal) => ({
            title: proposal.title || "N/A",
            status: "Executed",
            proposer: proposal.proposer,
            latitude: convertScaledCoordinate(proposal.latitude, SCALING_FACTOR),
            longitude: convertScaledCoordinate(proposal.longitude, SCALING_FACTOR),
          }));

          // Fetch proposalId from localhost and merge with convertedProposals
          const mergedProposals = await Promise.all(
            convertedProposals.map(async (convertedProposal, index) => {
              const correspondingRawProposal = rawProposals[index];
              try {
                const response = await axios.get(
                  `http://localhost:5000/proposal/ipfs?ipfsHash=${correspondingRawProposal.ipfsHash}`
                );
                const proposalId = response.data;
                return {
                  ...convertedProposal,
                  proposalId, // Add proposalId fetched from localhost
                };
              } catch (error) {
                console.error(
                  `Error fetching proposalId for IPFS hash ${correspondingRawProposal.ipfsHash}:`,
                  error
                );
                setLoading(false);
                return {
                  ...convertedProposal,
                  proposalId: null, // Handle error by setting proposalId to null
                };
              }
            })
          );
          setExecutedProposals(mergedProposals);
        } catch (error) {
          console.error("Error processing executed proposals:", error);
        } finally {
          setLoading(false);
        }
      };

      if (isWeb3Enabled && governorAddress) {
        fetchProposalsMetadata();
        fetchExecutedProposals();
      } else {
        setLoading(false);
      }
    }, [isWeb3Enabled, governorAddress]);
  } else {
    useEffect(() => {
      const fetchProposalsFromGraph = async () => {
        try {
          setLoading(true);
          if (!proposalsFromGraph) {
            setLoading(false);
            return;
          }

          const extractIpfsHash = (description) => {
            const parts = description.split("#");
            return parts.length > 1 ? parts[1] : null;
          };

          const proposalDetails = await Promise.all(
            proposalsFromGraph.proposalCreateds.map(async (proposal) => {
              const ipfsHash = proposal?.ipfsHash || extractIpfsHash(proposal.description);
              if (!ipfsHash) {
                console.warn(`No IPFS hash found in description: ${proposal.description}`);
                setLoading(false);
                return null;
              }

              try {
                const ipfsResponse = await axios.get(
                  `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
                );

                const stateOptions = {
                  abi: abiGovernor,
                  contractAddress: governorAddress,
                  functionName: "state",
                  params: { proposalId: proposal.proposalId },
                };

                let proposalState;
                await runContractFunction({
                  params: stateOptions,
                  onSuccess: (state) => (proposalState = state),
                  onError: (error) => console.error("Error fetching proposal state:", error),
                });

                const status = getStatusText(proposalState);

                return {
                  ...proposal,
                  ...ipfsResponse.data,
                  status,
                };
              } catch (error) {
                console.error(`Error processing proposal ${proposal.proposalId}:`, error);
                return null;
              }
            })
          );
          setProposals(proposalDetails);
        } catch (error) {
          console.error("Error processing proposals from The Graph:", error);
        } finally {
          setLoading(false);
        }
      };
      const fetchExecutedProposals = async () => {
        try {
          setLoading(true);

          const executedProposalsOptions = {
            abi: abiProposalContract,
            contractAddress: proposalContractAddress,
            functionName: "getAllProposals",
            params: {},
          };

          const rawProposals = await runContractFunction({
            params: executedProposalsOptions,
            onSuccess: (proposals) => proposals,
            onError: (error) => {
              console.error("Error fetching executed proposals:", error);
              return [];
            },
          });

          // Convert BigNumber coordinates and other required fields
          const convertedProposals = rawProposals.map((proposal, index) => ({
            title: proposal.title || "N/A",
            status: "Executed",
            proposer: proposal.proposer,
            latitude: convertScaledCoordinate(proposal.latitude, SCALING_FACTOR),
            longitude: convertScaledCoordinate(proposal.longitude, SCALING_FACTOR),
          }));
          if (executedProposalsFromGraph && executedProposalsFromGraph.proposalExecuteds) {
            const graphProposals = executedProposalsFromGraph.proposalExecuteds;

            const mergedProposals = convertedProposals.map((contractProposal, index) => ({
              ...contractProposal,
              proposalId: graphProposals[index]?.proposalId || null, // Use the proposalId from the Graph
            }));
            setExecutedProposals(mergedProposals);
          } else {
            setExecutedProposals(convertedProposals);
          }
        } catch (error) {
          console.error("Error processing executed proposals:", error);
        } finally {
          setLoading(false);
        }
      };

      if (isWeb3Enabled && governorAddress && proposalsFromGraph) {
        fetchProposalsFromGraph();
        fetchExecutedProposals();
      }
    }, [isWeb3Enabled, governorAddress, proposalsFromGraph]);
  }

  // Helper functions

  function convertScaledCoordinate(bigNumberValue, scalingFactor) {
    // Convert BigNumber to a JavaScript number or string
    const scaledValue = bigNumberValue.toNumber(); // or bigNumberValue.toNumber() if it's safe
    return scaledValue / scalingFactor; // Scale it back to the original value
  }

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

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "yellow";
      case "Active":
        return "blue";
      case "Canceled":
        return "red";
      case "Defeated":
        return "red";
      case "Succeeded":
        return "green";
      case "Queued":
        return "orange";
      case "Expired":
        return "gray";
      case "Executed":
        return "green";
      default:
        return "yellow";
    }
  };

  const handleProposalCreate = () => {
    router.push("/proposal/create");
  };

  const handleRowClick = (proposalId) => {
    router.push(`/proposal/${proposalId}`);
  };

  const pendingProposals = proposals.filter((proposal) => proposal.status !== "Executed");

  const tableDataPending = pendingProposals.map((proposal) => [
    <Avatar key={`${proposal.proposalId}-avatar`} isRounded size={36} theme="image" />,
    <span key={`${proposal.proposalId}-title`}>{proposal.title}</span>,
    <Tag
      key={`${proposal.proposalId}-status`}
      color={getStatusColor(proposal.status)}
      text={proposal.status}
    />,
    <span key={`${proposal.proposalId}-coordinates`}>{`${proposal.coordinates.lat.toFixed(
      7
    )}, ${proposal.coordinates.lng.toFixed(7)}`}</span>,
    <span key={`${proposal.proposalId}-proposer`}>{proposal.proposer}</span>,
  ]);

  const tableDataExecuted = executedProposals.map((proposal) => [
    <Avatar key={`${proposal.proposalId}-avatar`} isRounded size={36} theme="image" />,
    <span key={`${proposal.proposalId}-title`}>{proposal.title}</span>,
    <Tag
      key={`${proposal.proposalId}-status`}
      color={getStatusColor(proposal.status)}
      text={proposal.status}
    />,
    <span key={`${proposal.proposalId}-coordinates`}>{`${proposal.latitude.toFixed(
      6
    )}, ${proposal.longitude.toFixed(6)}`}</span>,
    <span key={`${proposal.proposalId}-proposer`}>{proposal.proposer}</span>,
  ]);

  return (
    <div className={styles.container}>
      {loading ? (
        <Spinner />
      ) : (
        <>
          <Header />
          <h2 className={styles.title}>Pending Proposals</h2>
          <div className={styles.proposalButton}>
            <Button
              text="+New Proposal"
              theme="primary"
              onClick={handleProposalCreate}
              size="large"
            />
          </div>
          <Table
            columnsConfig="80px 2fr 1fr 1fr 2fr"
            data={tableDataPending}
            header={[
              "",
              <span>Title</span>,
              <span>Status</span>,
              <span>Coordinates</span>,
              <span>Proposer</span>,
            ]}
            isColumnSortable={[false, true, false, false, false]}
            maxPages={3}
            pageSize={5}
            onPageNumberChanged={() => {}}
            onRowClick={(row) => handleRowClick(pendingProposals[row].proposalId)}
          />
          <h2 className={styles.title}>Executed Proposals</h2>
          <Table
            columnsConfig="80px 2fr 1fr 1fr 2fr"
            data={tableDataExecuted}
            header={[
              "",
              <span>Title</span>,
              <span>Status</span>,
              <span>Coordinates</span>,
              <span>Proposer</span>,
            ]}
            isColumnSortable={[false, true, false, false, false]}
            maxPages={3}
            pageSize={5}
            onPageNumberChanged={() => {}}
            onRowClick={(row) => handleRowClick(executedProposals[row].proposalId)}
          />
        </>
      )}
    </div>
  );
};
export default ProposalsPage;

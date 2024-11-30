// pages/proposals.js
import { useEffect, useState } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import axios from "axios";
import { useQuery, gql } from "@apollo/client";
import { Table, Avatar, Tag, Button, Modal } from "web3uikit";
import { abiGovernor, contractAddressesGovernor } from "../constants";
import Header from "../components/Header";
import styles from "../styles/ProposalsPage.module.css";
import { useRouter } from "next/router";
import { GET_PROPOSALS } from "../constants/subgraphQueries";

const ProposalsPage = () => {
  const { isWeb3Enabled, chainId: chainIdHex, account } = useMoralis();
  const chainId = parseInt(chainIdHex, 16);
  const [proposals, setProposals] = useState([]);
  const { runContractFunction } = useWeb3Contract();
  const router = useRouter();

  const governorAddress =
    chainId in contractAddressesGovernor ? contractAddressesGovernor[chainId][0] : null;

  const { loading, error, data: proposalsFromGraph } = useQuery(GET_PROPOSALS);
  if (chainId === 31337) {
    useEffect(() => {
      const fetchProposalsMetadata = async () => {
        try {
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
        }
      };

      if (isWeb3Enabled && governorAddress) {
        fetchProposalsMetadata();
      }
    }, [isWeb3Enabled, governorAddress]);
  } else {
    useEffect(() => {
      const fetchProposalsFromGraph = async () => {
        try {
          if (!proposalsFromGraph) return; // Wait for data to be available
          console.log("ProposalsGraph:", proposalsFromGraph);
          const extractIpfsHash = (description) => {
            const parts = description.split("#");
            return parts.length > 1 ? parts[1] : null;
          };

          const proposalDetails = await Promise.all(
            proposalsFromGraph.proposalCreateds.map(async (proposal) => {
              const ipfsHash = extractIpfsHash(proposal.description);
              console.log("IPFS Hash:", ipfsHash);
              if (!ipfsHash) {
                console.warn(`No IPFS hash found in description: ${proposal.description}`);
                return null;
              }

              try {
                const ipfsResponse = await axios.get(
                  `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
                );
                console.log("IPFS Response:", ipfsResponse.data);
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
                return null; // Handle individual proposal fetch failure gracefully
              }
            })
          );
          setProposals(proposalDetails);
        } catch (error) {
          console.error("Error processing proposals from The Graph:", error);
        }
      };

      if (isWeb3Enabled && governorAddress && proposalsFromGraph) {
        fetchProposalsFromGraph();
      }
    }, [isWeb3Enabled, governorAddress, proposalsFromGraph]);
  }

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

  const tableData = proposals.map((proposal) => [
    <Avatar key={`${proposal.proposalId}-avatar`} isRounded size={36} theme="image" />,
    <span key={`${proposal.proposalId}-title`}>{proposal.title}</span>,
    <Tag
      key={`${proposal.proposalId}-status`}
      color={getStatusColor(proposal.status)}
      text={proposal.status}
    />,
    <span
      key={`${proposal.proposalId}-coordinates`}
    >{`${proposal.coordinates.lat}, ${proposal.coordinates.lng}`}</span>,
    <span key={`${proposal.proposalId}-proposer`}>{proposal.proposer}</span>,
  ]);

  const handleProposalCreate = () => {
    router.push("/proposal/create");
  };

  const handleRowClick = (proposalId) => {
    console.log("Row clicked:", proposalId);
    router.push(`/proposal/${proposalId}`);
  };

  return (
    <div className={styles.container}>
      <Header />
      <h2 className={styles.title}>Recent Proposals</h2>
      <div className={styles.proposalButton}>
        <Button text="+New Proposal" theme="primary" onClick={handleProposalCreate} size="large" />
      </div>
      <Table
        columnsConfig="80px 2fr 1fr 1fr 2fr"
        data={tableData}
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
        onRowClick={(row) => handleRowClick(proposals[row].proposalId)}
      />
    </div>
  );
};

export default ProposalsPage;

import { useEffect, useState } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { useQuery, gql } from "@apollo/client";
import axios from "axios";
import extractIpfsHash from "../../utils/extractIpfsHash";
import getStatusColor from "../../utils/proposalsUtils/tableUtils";
import { getStatusText } from "../../utils/map-utils/tableUtils";
import { abiGovernor, contractAddressesGovernor } from "../../constants";
import { Table, Avatar, Tag } from "web3uikit";
import { useRouter } from "next/router";
import styles from "../../styles/ProposalsTable.module.css";
import { GET_PROPOSALS } from "../../constants/subgraphQueries";

const ProposalsTable = () => {
  const router = useRouter();
  const { isWeb3Enabled, chainId: chainIdHex, account } = useMoralis();
  const chainId = parseInt(chainIdHex, 16); // Convert hex chainId to integer
  const [proposals, setProposals] = useState([]);

  const governorAddress =
    chainId in contractAddressesGovernor ? contractAddressesGovernor[chainId][0] : null;

  const { runContractFunction } = useWeb3Contract();

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
                onSuccess: (state) => {
                  proposalState = state;
                },
                onError: (error) => console.error("Error fetching proposal state:", error),
              });

              const status = getStatusText(proposalState); // Call getStatusText once state is confirmed

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

          const proposalDetails = await Promise.all(
            proposalsFromGraph.proposalCreateds.map(async (proposal) => {
              const ipfsHash = proposal?.ipfsHash || extractIpfsHash(proposal.description);
              if (!ipfsHash) {
                console.warn(`No IPFS hash found in description: ${proposal.description}`);
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

  const tableData = proposals.map((proposal) => {
    return [
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
    ];
  });

  const handleRowClick = (proposalId) => {
    router.push(`/proposal/${proposalId}`);
  };

  return (
    <div className={styles.container}>
      <h2>Recent Proposals</h2>
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

export default ProposalsTable;

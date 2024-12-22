import { useEffect, useState } from "react";
import Select from "react-select";
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
import categoryEmojiMap from "../constants/emojiMappings";
import { SCALING_FACTOR } from "../constants/variables";
import extractIpfsHash from "../utils/extractIpfsHash";
import getStatusColor from "../utils/proposalsUtils/tableUtils";
import { getStatusText } from "../utils/map-utils/tableUtils";
import { convertScaledCoordinate } from "../utils/map-utils/convertCoordsUtils";
import categoryMapping from "../constants/categoryMapping";
import CategoryEnums from "../constants/categoryEnums";
import Header from "../components/Header";
import Spinner from "../components/Spinner/Spinner";
import styles from "../styles/ProposalsPage.module.css";
import { useRouter } from "next/router";
import { GET_PROPOSALS, GET_EXECUTED_PROPOSALS } from "../constants/subgraphQueries";

const ProposalsPage = () => {
  const { isWeb3Enabled, chainId: chainIdHex } = useMoralis();
  const chainId = parseInt(chainIdHex, 16);
  const [proposals, setProposals] = useState([]);
  const [executedProposals, setExecutedProposals] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(["All"]);
  const [loading, setLoading] = useState(false);
  const { runContractFunction } = useWeb3Contract();
  const router = useRouter();

  const governorAddress =
    chainId in contractAddressesGovernor ? contractAddressesGovernor[chainId][0] : null;

  const proposalContractAddress =
    chainId in contractAddressesProposalContract
      ? contractAddressesProposalContract[chainId][0]
      : null;

  const { error, data: proposalsFromGraph } = useQuery(GET_PROPOSALS);
  const { data: executedProposalsFromGraph } = useQuery(GET_EXECUTED_PROPOSALS);

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

        const convertedProposals = rawProposals.map((proposal) => ({
          title: proposal.title || "N/A",
          status: "Executed",
          proposer: proposal.proposer,
          latitude: convertScaledCoordinate(
            proposal.latitude,
            ethers.BigNumber.from(SCALING_FACTOR)
          ),
          longitude: convertScaledCoordinate(
            proposal.longitude,
            ethers.BigNumber.from(SCALING_FACTOR)
          ),
          category: proposal.category || "N/A",
        }));

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
                proposalId,
              };
            } catch (error) {
              console.error(
                `Error fetching proposalId for IPFS hash ${correspondingRawProposal.ipfsHash}:`,
                error
              );
              setLoading(false);
              return {
                ...convertedProposal,
                proposalId: null,
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

    const fetchProposalsFromGraph = async () => {
      try {
        setLoading(true);
        if (!proposalsFromGraph) {
          setLoading(false);
          return;
        }

        const proposalDetails = await Promise.all(
          proposalsFromGraph.proposalCreateds.map(async (proposal) => {
            const ipfsHash = proposal?.ipfsHash || extractIpfsHash(proposal.description);
            if (!ipfsHash) {
              console.warn(`No IPFS hash found in description: ${proposal.description}`);
              setLoading(false);
              return null;
            }

            try {
              const ipfsResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);

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

    const fetchExecutedProposalsFromGraph = async () => {
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
          latitude: convertScaledCoordinate(
            proposal.latitude,
            ethers.BigNumber.from(SCALING_FACTOR)
          ),
          longitude: convertScaledCoordinate(
            proposal.longitude,
            ethers.BigNumber.from(SCALING_FACTOR)
          ),
          category: proposal.category || "N/A",
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

    if (isWeb3Enabled && governorAddress) {
      if (chainId === 31337) {
        fetchProposalsMetadata();
        fetchExecutedProposals();
      } else if (proposalsFromGraph) {
        fetchProposalsFromGraph();
        fetchExecutedProposalsFromGraph();
      }
    } else {
      setLoading(false);
    }
  }, [isWeb3Enabled, governorAddress, proposalsFromGraph, chainId]);

  const handleProposalCreate = () => {
    router.push("/proposal/create");
  };

  const handleRowClick = (proposalId) => {
    router.push(`/proposal/${proposalId}`);
  };

  // Filter proposals by selected category
  const pendingProposals = proposals.filter((proposal) => proposal.status !== "Executed");
  // Reverse the categoryMapping for numeric-to-name mapping
  const reverseCategoryMapping = Object.fromEntries(
    Object.entries(categoryMapping).map(([key, value]) => [value, key])
  );

  const filteredPendingProposals = pendingProposals.filter((proposal) => {
    const categoryName = reverseCategoryMapping[proposal.category]; // Map number to name
    const categoryEnumValue = CategoryEnums[categoryName.replace(/ /g, "")]; // Get enum value
    // Check if any of the selected categories match or "All" is selected
    return selectedCategory.includes("All") || selectedCategory.includes(categoryEnumValue);
  });

  const filteredExecutedProposals = executedProposals.filter((proposal) => {
    const categoryName = reverseCategoryMapping[proposal.category]; // Map number to name
    const categoryEnumValue = CategoryEnums[categoryName.replace(/ /g, "")]; // Get enum value

    // Check if any of the selected categories match or "All" is selected
    return selectedCategory.includes("All") || selectedCategory.includes(categoryEnumValue);
  });

  const tableDataPending = filteredPendingProposals.map((proposal) => {
    const categoryName = reverseCategoryMapping[proposal.category]; // Map number to name
    return [
      <Avatar key={`${proposal.proposalId}-avatar`} isRounded size={36} theme="image" />,
      <span key={`${proposal.proposalId}-title`}>{proposal.title}</span>,
      <Tag
        key={`${proposal.proposalId}-status`}
        color={getStatusColor(proposal.status)}
        text={proposal.status}
      />,
      <span key={`${proposal.proposalId}-coordinates`}>
        {`${proposal.coordinates.lat}, ${proposal.coordinates.lng}`}
      </span>,
      <span key={`${proposal.proposalId}-proposer`}>{proposal.proposer}</span>,
      <span key={`${proposal.proposalId}-category`}>{categoryName || "Unknown Category"}</span>,
    ];
  });

  const tableDataExecuted = filteredExecutedProposals.map((proposal) => {
    const categoryName = reverseCategoryMapping[proposal.category]; // Map number to name
    return [
      <Avatar key={`${proposal.proposalId}-avatar`} isRounded size={36} theme="image" />,
      <span key={`${proposal.proposalId}-title`}>{proposal.title}</span>,
      <Tag
        key={`${proposal.proposalId}-status`}
        color={getStatusColor(proposal.status)}
        text={proposal.status}
      />,
      <span key={`${proposal.proposalId}-coordinates`}>
        {`${proposal.latitude}, ${proposal.longitude}`}
      </span>,
      <span key={`${proposal.proposalId}-proposer`}>{proposal.proposer}</span>,
      <span key={`${proposal.proposalId}-category`}>{categoryName || "Unknown Category"}</span>,
    ];
  });

  // Dropdown options using `CategoryEnums`
  const categoryOptions = [
    {
      label: `${categoryEmojiMap["All"]} All`,
      value: "All",
    },
    ...Object.values(CategoryEnums).map((category) => ({
      label: (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {categoryEmojiMap[category]}
          <span>{category}</span>
        </div>
      ),
      value: category,
    })),
  ];

  return (
    <div className={styles.container}>
      {loading ? (
        <Spinner />
      ) : (
        <>
          <Header />
          <div className={styles.filterAndButton}>
            <div className={styles.filterContainer}>
              <label htmlFor="categoryFilter">Filter Categories</label>
              <Select
                isMulti
                id="categoryFilter"
                label="Filter Categories"
                options={categoryOptions}
                value={categoryOptions.filter((option) => selectedCategory.includes(option.value))}
                onChange={(options) => {
                  const selectedValues = options.map((option) => option.value);
                  if (selectedValues.includes("All") && selectedValues.length > 1) {
                    // Remove "All" if other categories are selected
                    setSelectedCategory(selectedValues.filter((value) => value !== "All"));
                  } else if (selectedValues.length === 0) {
                    // Default back to "All" if no categories are selected
                    setSelectedCategory(["All"]);
                  } else {
                    setSelectedCategory(selectedValues);
                  }
                }}
                placeholder="Select categories"
                className={styles.filterDropdown}
                classNamePrefix="filter"
              />
            </div>
            <div className={styles.proposalButton}>
              <Button
                text="+New Proposal"
                theme="primary"
                onClick={handleProposalCreate}
                size="large"
              />
            </div>
          </div>
          <h2 className={styles.title}>Pending Proposals</h2>

          <Table
            columnsConfig="80px 2fr 1fr 1fr 1fr 2fr"
            data={tableDataPending}
            header={[
              "",
              <span key="title">Title</span>,
              <span key="status">Status</span>,
              <span key="coordinates">Coordinates</span>,
              <span key="proposer">Proposer</span>,
              <span key="category">Category</span>,
            ]}
            isColumnSortable={[false, true, false, false, false]}
            maxPages={10}
            pageSize={5}
            onPageNumberChanged={() => {}}
            onRowClick={(row) => handleRowClick(filteredPendingProposals[row].proposalId)}
          />
          <h2 className={styles.title}>Executed Proposals</h2>
          <Table
            columnsConfig="80px 2fr 1fr 1fr 1fr 2fr"
            data={tableDataExecuted}
            header={[
              "",
              <span key="title">Title</span>,
              <span key="status">Status</span>,
              <span key="coordinates">Coordinates</span>,
              <span key="proposer">Proposer</span>,
              <span key="category">Category</span>,
            ]}
            isColumnSortable={[false, true, false, false, false]}
            maxPages={10}
            pageSize={5}
            onPageNumberChanged={() => {}}
            onRowClick={(row) => handleRowClick(filteredExecutedProposals[row].proposalId)}
          />
        </>
      )}
    </div>
  );
};
export default ProposalsPage;

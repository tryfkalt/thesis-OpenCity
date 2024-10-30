// pages/proposals.js
import { useEffect, useState } from "react";
import axios from "axios";
import { abiGovernor, contractAddressesGovernor } from "../constants";
import { Table, Avatar, Tag } from "web3uikit";
import { useMoralis, useWeb3Contract } from "react-moralis";
import styles from "../styles/Home.module.css";
import Header from "../components/Header";

const ProposalsPage = () => {
  const { isWeb3Enabled, chainId: chainIdHex, account } = useMoralis();
  const chainId = parseInt(chainIdHex, 16);
  const [proposals, setProposals] = useState([]);
  const governorAddress =
    chainId in contractAddressesGovernor ? contractAddressesGovernor[chainId][0] : null;
  const { runContractFunction } = useWeb3Contract();

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

  return (
    <div className={styles.container}>
      <h2>Proposals</h2>
      <Header />
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
        onRowClick={(e, row) => console.log("Row clicked:", row)}
      />
    </div>
  );
};

export default ProposalsPage;

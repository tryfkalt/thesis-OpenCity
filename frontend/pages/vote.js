import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useMoralis } from "react-moralis";
import axios from "axios";
import VoteHeader from "../components/Vote/VoteHeader";
import VoteDetails from "../components/Vote/VoteDetails";
import VoteForm from "../components/Vote/VoteForm";
import Header from "../components/Vote/Header";
// import supportedChains from "../constants/supportedChains"; // Assuming you have supportedChains defined
// import styles from "../styles/Vote.module.css"; // Assuming you have Vote specific styles


const supportedChains = ["31337", "11155111"];
const VotePage = () => {
  const router = useRouter();
  const { proposalId } = router.query;
  const [proposalDetails, setProposalDetails] = useState(null);
  
  const { isWeb3Enabled, chainId: chainIdHex } = useMoralis();
  const chainId = parseInt(chainIdHex, 16);
  
  useEffect(() => {
    if (proposalId && isWeb3Enabled) {
      fetchProposalDetails(proposalId);
    }
  }, [proposalId, isWeb3Enabled]);

  const fetchProposalDetails = async (proposalId) => {
    try {
      const response = await axios.get(`http://localhost:5000/proposals/${proposalId}`);
      console.log("Proposal details:", response.data);
      setProposalDetails(response.data);
    } catch (error) {
      console.error("Error fetching proposal details:", error);
    }
  };

  const handleVoteSubmission = (voteData) => {
    console.log("Submitting vote:", voteData);
    // You can handle vote submission logic here, such as sending the vote to your backend or blockchain
  };

  return (
    <div>
      <Header />
      {/* Web3 Enabled Check */}
      {isWeb3Enabled ? (
        <div>
          {/* Chain Id Support Check */}
          {supportedChains.includes(parseInt(chainId).toString()) ? (
            <>
              <VoteHeader />
              <VoteDetails proposalDetails={proposalDetails} />
              <VoteForm proposalDetails={proposalDetails} />
            </>
          ) : (
            <div>{`Please switch to a supported chain. The supported Chain Ids are: ${supportedChains}`}</div>
          )}
        </div>
      ) : (
        <div>Please connect to a Wallet</div>
      )}
    </div>
  );
};

export default VotePage;

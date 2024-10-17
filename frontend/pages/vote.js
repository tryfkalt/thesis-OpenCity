import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";
import VoteHeader from "../components/Vote/VoteHeader";
import VoteDetails from "../components/Vote/VoteDetails";
import VoteForm from "../components/Vote/VoteForm";

const VotePage = () => {
  const router = useRouter();
  const { proposalId } = router.query;
  const [proposalDetails, setProposalDetails] = useState(null);

  useEffect(() => {
    if (proposalId) {
      fetchProposalDetails(proposalId);
    }
  }, [proposalId]);

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
      <VoteHeader />
      <VoteDetails proposalDetails={proposalDetails} />
      {/* <VoteForm handleVoteSubmission={handleVoteSubmission} proposalDetails={proposalDetails} />
     */}
      <VoteForm proposalDetails={proposalDetails} />
    </div>
  );
};

export default VotePage;

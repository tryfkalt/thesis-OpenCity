import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";

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

  const handleVote = (vote) => {
    console.log("Voting for proposal:", proposalId, "with vote:", vote);
    // Add vote handling logic here
  };

  return (
    <div>
      <h2>Vote on Proposal</h2>
      {proposalDetails ? (
        <div>
          <h3>{proposalDetails.title}</h3>
          <p>{proposalDetails.description}</p>
          <button onClick={() => handleVote(true)}>Vote Yes</button>
          <button onClick={() => handleVote(false)}>Vote No</button>
        </div>
      ) : (
        <p>Loading proposal details...</p>
      )}
    </div>
  );
};

export default VotePage;

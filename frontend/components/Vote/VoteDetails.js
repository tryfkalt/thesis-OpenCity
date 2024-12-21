import React from "react";
import styles from "../../styles/VoteForm.module.css";

const VoteDetails = ({ proposalDetails }) => {
  if (!proposalDetails) {
    return <p>Loading proposal details...</p>;
  }

  return (
    <div>
      <h3
        className={styles.voteModalTitle}
      >
        {proposalDetails.title}
      </h3>
    </div>
  );
};

export default VoteDetails;

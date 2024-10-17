import React from 'react';

const VoteDetails = ({ proposalDetails }) => {
  if (!proposalDetails) {
    return <p>Loading proposal details...</p>;
  }

  return (
    <div>
      <h3>{proposalDetails.title}</h3>
      <p>{proposalDetails.description}</p>
    </div>
  );
};

export default VoteDetails;
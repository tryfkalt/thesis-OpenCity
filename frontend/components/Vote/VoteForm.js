import React, { useState } from "react";
import { Radios, Input, Button } from "web3uikit";

const VoteForm = ({ proposalDetails }) => {
  const [vote, setVote] = useState(null);
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (vote === null) {
      alert("Please select Yes or No.");
      return;
    }
    console.log("Submitting vote:", { vote, reason });
  };

  return (
    <div>
      <h3>Cast your vote</h3>
      <Radios
        id="radios"
        items={["No", "Yes", "Abstain"]}
        onBlur={function noRefCheck() {}}
        onChange={(event)=> setVote(event.target.value)}
        title="Do you agree with this proposal?"
      />

      <Input
        label="State your reason"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Explain why you are voting this way..."
        textarea
      />
      <Button
        onClick={function noRefCheck() {
          handleSubmit();
        }}
        text="Submit Vote"
      />
    </div>
  );
};

export default VoteForm;

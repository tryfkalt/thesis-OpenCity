const fs = require("fs");
const path = require("path");

const proposalDataPath = path.join(__dirname, "data/proposalData.json");

// Function to get the latest proposal data from proposalData.json
function getLatestProposal() {
  try {
    const data = fs.readFileSync(proposalDataPath, "utf8");
    const proposals = JSON.parse(data);
    return proposals[proposals.length - 1]; // Get the latest proposal
  } catch (error) {
    console.error("Error reading proposal data:", error);
    return null;
  }
}

const latestProposal = getLatestProposal();

export const networkConfig = {
  localhost: {},
  hardhat: {},
  sepolia: {
    blockConfirmations: 6,
  },
};

export const developmentChains = ["hardhat", "localhost"];
export const proposalsFile = "proposals.json";

// Governor Values
export const QUORUM_PERCENTAGE = 4; // Need 4% of voters to pass
export const MIN_DELAY = 3600; // 1 hour - after a vote passes, you have 1 hour before you can enact
export const VOTING_PERIOD = 5; // blocks
export const VOTING_DELAY = 1; // 1 Block - How many blocks till a proposal vote becomes active
export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

// Set STORE_PARAMS with data from the latest proposal, or default values if no proposal found
export const STORE_PARAMS = latestProposal
  ? [
      latestProposal.title,
      latestProposal.description,
      latestProposal.coordinates.lat  * 1e6, // multiplying lat and lng by 1e6 to convert to integer
      latestProposal.coordinates.lng  * 1e6,
    ]
  : [
      "Default Title",
      "Default Description",
      0,
      0,
    ];

export const FUNC = "storeHazard";
export const PROPOSAL_DESCRIPTION = "Proposal to store hazard information.";
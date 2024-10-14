const fs = require("fs");
const path = require("path");

const createProposal = async (req, res) => {
  const { title, description, coordinates } = req.body;
  const lat = parseFloat(coordinates.lat); // Use parseFloat to handle decimals
  const lng = parseFloat(coordinates.lng);

  // Format the proposal data
  const proposalData = {
    title,
    description,
    coordinates: {
      lat,
      lng,
    },
  };

  // Define the file path for saving proposals
  const proposalsDataPath = path.join(__dirname, "../data/proposalData.json");

  // Load existing proposals or create a new array if file does not exist
  let proposals = [];
  if (fs.existsSync(proposalsDataPath)) {
    const existingData = fs.readFileSync(proposalsDataPath, "utf8");
    proposals = JSON.parse(existingData);
  }

  // Append the new proposal
  proposals.push(proposalData);

  // Store Proposal ID;

  await storeProposalId(proposalData);

  // Write updated proposals to the file
  try {
    fs.writeFileSync(proposalsDataPath, JSON.stringify(proposals, null, 2), "utf8");
    res.status(200).json({ message: "Proposal submitted successfully", proposal: proposalData });
  } catch (error) {
    console.error("Error writing proposal to file:", error);
    res.status(500).json({ error: "Failed to save proposal" });
  }
};

async function storeProposalId(proposalId) {
  
  console.log(chainId);
  let proposals;
  const proposalsFile = "proposals.json";
  if (fs.existsSync(proposalsFile)) {
    proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));
  } else {
    proposals = {};
    proposals[chainId] = [];
  }
  // console.log(proposals);
  proposals[chainId].push(proposalId.toString());
  fs.writeFileSync(proposalsFile, JSON.stringify(proposals), "utf8");
}

module.exports = { createProposal };
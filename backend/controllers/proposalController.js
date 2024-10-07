const fs = require("fs");
const path = require("path");

exports.createProposal = async (req, res) => {
  const { title, description, coordinates } = req.body;
  const lat = parseFloat(coordinates.lat); // Use parseFloat to handle decimals
  const lng = parseFloat(coordinates.lng);

  // Format the proposal data
  const proposalData = {
    title,
    description,
    coordinates: {
      lat,
      lng
    }
  };

  // Define the file path for saving proposals
  const proposalsFilePath = path.join(__dirname, "../data/proposalData.json");

  // Load existing proposals or create a new array if file does not exist
  let proposals = [];
  if (fs.existsSync(proposalsFilePath)) {
    const existingData = fs.readFileSync(proposalsFilePath, "utf8");
    proposals = JSON.parse(existingData);
  }

  // Append the new proposal
  proposals.push(proposalData);

  // Write updated proposals to the file
  try {
    fs.writeFileSync(proposalsFilePath, JSON.stringify(proposals, null, 2), "utf8");
    res.status(200).json({ message: "Proposal submitted successfully", proposal: proposalData });
  } catch (error) {
    console.error("Error writing proposal to file:", error);
    res.status(500).json({ error: "Failed to save proposal" });
  }
};
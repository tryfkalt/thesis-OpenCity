const fs = require("fs");
const path = require("path");
const { network, ethers } = require("hardhat");
const { pinJSONToIPFS } = require("../pinataClient");
const axios = require("axios");
const { developmentChains } = require("../helper-hardhat-config");

const createProposal = async (req, res) => {
  console.log("Request body received:", req.body);
  const { title, description, coordinates, proposalId, proposer } = req.body;
  const lat = parseFloat(coordinates.lat); // Use parseFloat to handle decimals
  const lng = parseFloat(coordinates.lng);
  const ipfsHash = req.body.ipfsHash;
  // Format the proposal data
  const proposalData = {
    title,
    description,
    coordinates: {
      lat,
      lng,
    },
    proposalId,
    proposer,
    ipfsHash,
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

  try {
    // Upload proposal data to IPFS via Pinata
    const pinataResult = await pinJSONToIPFS(proposalData);
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${pinataResult.IpfsHash}`;

    // Get the chain ID
    const chainId = network.config.chainId.toString();
    // Store Proposal ID with chain ID and IPFS hash
    await storeProposalId(proposalData.proposalId, chainId, pinataResult.IpfsHash);

    // Write updated proposals to the file
    fs.writeFileSync(proposalsDataPath, JSON.stringify(proposals, null, 2), "utf8");
    res.status(200).json({
      message: "Proposal submitted successfully",
      proposal: proposalData,
      ipfsHash: pinataResult.IpfsHash,
      ipfsUrl,
    });
  } catch (error) {
    console.error("Error writing proposal to file:", error);
    res.status(500).json({ error: "Failed to save proposal" });
  }
};

async function storeProposalId(proposalId, chainId, ipfsHash) {
  let proposals;
  const proposalsFile = "proposals.json";
  if (fs.existsSync(proposalsFile)) {
    proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));
  } else {
    proposals = {};
  }

  if (!proposals[chainId]) {
    proposals[chainId] = [];
  }

  proposals[chainId].push({ proposalId, ipfsHash }); // Store both proposal ID and IPFS hash
  fs.writeFileSync(proposalsFile, JSON.stringify(proposals, null, 2), "utf8");
}

const getProposalData = async (req, res) => {
  const { proposalId } = req.params;

  // Load the proposals.json file
  const proposalsFile = path.join(__dirname, "../proposals.json");
  const proposalsData = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));
  const chainId = network.config.chainId.toString();

  // Find the proposal entry by proposalId
  const proposal = proposalsData[chainId]?.find((entry) => entry.proposalId === proposalId);

  if (!proposal || !proposal.ipfsHash) {
    return res.status(404).json({ error: "Proposal not found or IPFS hash missing." });
  }

  try {
    // Fetch data from IPFS using the IPFS hash
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${proposal.ipfsHash}`;
    const ipfsResponse = await axios.get(ipfsUrl);

    return res.status(200).json(ipfsResponse.data);
  } catch (error) {
    console.error("Error fetching data from IPFS:", error);
    return res.status(500).json({ error: "Failed to fetch proposal data from IPFS." });
  }
};

const getProposals = async (req, res) => {
  const proposalsFile = path.join(__dirname, "../proposals.json");
  const proposalsData = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));
  const chainId = network.config.chainId.toString();

  const chainProposals = proposalsData[chainId];

  if (!chainProposals) {
    return res.status(404).json({ error: "No proposals found for this chain." });
  }

  return res.status(200).json(chainProposals);
};

const storeExecHash = async (req, res) => {
  const { proposalId } = req.params;
  const { txHash } = req.body;
  console.log("Received transaction hash for proposal", proposalId, ":", txHash);
  if (!txHash) {
    return res.status(400).json({ error: "Transaction hash is required" });
  }

  const execHashesFile = path.join(__dirname, "../data/execHash.json");
  let execHashes = {};

  if (fs.existsSync(execHashesFile)) {
    execHashes = JSON.parse(fs.readFileSync(execHashesFile, "utf8"));
  }

  execHashes[proposalId] = txHash;

  fs.writeFileSync(execHashesFile, JSON.stringify(execHashes, null, 2), "utf8");

  res.status(200).json({ message: "Transaction hash stored successfully" });
};

const getExecHash = async (req, res) => {
  const { proposalId } = req.params;
  console.log("Fetching transaction hash for proposal:", proposalId);
  const execHashesFile = path.join(__dirname, "../data/execHash.json");
  let execHashes = {};
  console.log("execHashesFile", execHashesFile);
  if (fs.existsSync(execHashesFile)) {
    execHashes = JSON.parse(fs.readFileSync(execHashesFile, "utf8"));
  }

  const txHash = execHashes[proposalId];
  console.log("txHash", txHash);
  if (!txHash) {
    return res.status(404).json({ error: "Transaction hash not found for this proposal" });
  }

  return res.status(200).json({ txHash });
};

module.exports = { createProposal, getProposalData, getProposals, storeExecHash, getExecHash };

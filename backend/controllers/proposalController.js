const fs = require("fs");
const path = require("path");
const { network } = require("hardhat");
const { pinJSONToIPFS } = require("../pinataClient");
const axios = require("axios");

/**
 * Creates a new proposal and saves it to the file system and IPFS.
 *
 * @async
 * @function createProposal
 * @param {Object} req.body - The body of the request containing proposal details.
 * @param {string} req.body.title - The title of the proposal.
 * @param {string} req.body.description - The description of the proposal.
 * @param {Object} req.body.coordinates - The coordinates of the proposal location.
 * @param {string} req.body.coordinates.lat - The latitude of the proposal location.
 * @param {string} req.body.coordinates.lng - The longitude of the proposal location.
 * @param {string} req.body.category - The category of the proposal.
 * @param {string} req.body.proposalId - The unique identifier for the proposal.
 * @param {string} req.body.proposer - The proposer of the proposal.
 * @param {string} req.body.ipfsHash - The IPFS hash of the proposal data.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the proposal is created.
 * @throws {Error} - If there is an error saving the proposal.
 */
const createProposal = async (req, res) => {
  const { title, description, coordinates, category, proposalId, proposer } = req.body;
  console.log("req.body", req.body);
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
    category,
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

/**
 * Stores a proposal ID and its corresponding IPFS hash in a JSON file.
 *
 * This function reads the existing proposals from a JSON file, adds the new proposal ID and IPFS hash
 * to the appropriate chain ID array, and writes the updated proposals back to the file.
 *
 * @async
 * @function storeProposalId
 * @param {string} proposalId - The unique identifier for the proposal.
 * @param {string} chainId - The identifier for the blockchain network.
 * @param {string} ipfsHash - The IPFS hash associated with the proposal.
 * @throws {Error} If there is an error reading from or writing to the file.
 */
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

/**
 * Retrieves proposal data based on the provided proposal ID.
 *
 * @async
 * @function getProposalData
 * @param {string} req.params.proposalId - The ID of the proposal to retrieve.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves with the proposal data or an error response.
 *
 * @throws {Error} If there is an issue reading the proposals file or fetching data from IPFS.
 */

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

/**
 * Retrieves proposals for the specified blockchain network.
 *
 * This function reads proposals from a JSON file and returns the proposals
 * corresponding to the chain ID specified in the network configuration.
 *
 * @async
 * @function getProposals
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves with the response containing the proposals.
 * @throws {Error} - If there is an issue reading the proposals file or parsing the JSON data.
 */

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

/**
 * Retrieves a proposal from IPFS based on the provided IPFS hash.
 *
 * @async
 * @function getProposalFromIPFS
 * @param {Object} req - The request object.
 * @param {Object} req.query - The query parameters of the request.
 * @param {string} req.query.ipfsHash - The IPFS hash of the proposal to retrieve.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves with the proposal data or an error message.
 *
 * @throws {Error} If there is an issue reading the proposal data from the file system or parsing JSON.
 *
 * @example
 * / Example request:
 * / GET /api/proposal?ipfsHash=Qm...
 *
 * / Example response:
 * / 200 OK
 * / { proposalId: "12345" }
 *
 * / Error responses:
 * / 400 Bad Request
 * / { error: "IPFS hash is required" }
 *
 * / 404 Not Found
 * / { error: "Proposal not found" }
 *
 * / 500 Internal Server Error
 * / { error: "Failed to fetch proposal data from IPFS." }
 */
const getProposalFromIPFS = async (req, res) => {
  try {
    const { ipfsHash } = req.query;
    if (!ipfsHash) {
      return res.status(400).json({ error: "IPFS hash is required" });
    }
    console.log("ipfsHash", ipfsHash);
    const proposalsFile = path.join(__dirname, "../data/proposalData.json");
    const proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));
    console.log("proposals", proposals);
    const proposal = proposals.find((entry) => entry.ipfsHash === ipfsHash);
    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    console.log("Sending:", proposal.proposalId);
    return res.status(200).json(proposal.proposalId);
  } catch (error) {
    console.error("Error fetching data from IPFS:", error);
    return res.status(500).json({ error: "Failed to fetch proposal data from IPFS." });
  }
};

/**
 * Stores the execution transaction hash for a given proposal.
 *
 * @async
 * @function storeExecHash
 * @param {Object} req - Express request object.
 * @param {Object} req.params - Request parameters.
 * @param {string} req.params.proposalId - The ID of the proposal.
 * @param {Object} req.body - Request body.
 * @param {string} req.body.txHash - The transaction hash to be stored.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response with a success message or an error message.
 *
 * @throws {Error} If there is an issue reading or writing the execution hashes file.
 */
const storeExecHash = async (req, res) => {
  const { proposalId } = req.params;
  const { txHash } = req.body;
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

/**
 * Retrieves the execution hash for a given proposal.
 *
 * This function reads from a JSON file containing execution hashes and returns the hash
 * associated with the provided proposal ID. If the hash is not found, it responds with a 404 status.
 *
 * @async
 * @function getExecHash
 * @param {Object} req - The request object.
 * @param {Object} req.params - The parameters of the request.
 * @param {string} req.params.proposalId - The ID of the proposal to retrieve the execution hash for.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves with the response containing the execution hash or an error message.
 */
const getExecHash = async (req, res) => {
  const { proposalId } = req.params;
  const execHashesFile = path.join(__dirname, "../data/execHash.json");
  let execHashes = {};
  if (fs.existsSync(execHashesFile)) {
    execHashes = JSON.parse(fs.readFileSync(execHashesFile, "utf8"));
  }

  const txHash = execHashes[proposalId];
  if (!txHash) {
    return res.status(404).json({ error: "Transaction hash not found for this proposal" });
  }

  return res.status(200).json({ txHash });
};

module.exports = {
  createProposal,
  getProposalData,
  getProposals,
  getProposalFromIPFS,
  storeExecHash,
  getExecHash,
};

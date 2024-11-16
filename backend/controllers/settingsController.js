const fs = require("fs");
const path = require("path");
const { network, ethers } = require("hardhat");

const getGovernorSettings = async (req, res) => {
  try {
    // Map `network.name` to the correct folder if needed
    const networkFolderMap = {
      hardhat: "localhost", // Map 'hardhat' to 'localhost'
    };

    const folderName = networkFolderMap[network.name] || network.name;

    const governorPath = path.join(
      __dirname,
      "../deployments",
      folderName,
      "GovernorContract.json"
    );
    const tokenPath = path.join(__dirname, "../deployments", folderName, "GovernanceToken.json");

    console.log("Governor Path:", governorPath);

    // Ensure deployment files exist
    if (!fs.existsSync(governorPath) || !fs.existsSync(tokenPath)) {
      return res.status(404).json({ error: "Contract addresses not found for this network." });
    }

    const governorContractAddress = JSON.parse(fs.readFileSync(governorPath, "utf8")).address;
    const tokenContractAddress = JSON.parse(fs.readFileSync(tokenPath, "utf8")).address;

    console.log("Governor Contract Address:", governorContractAddress);
    console.log("Token Contract Address:", tokenContractAddress);

    const governorContract = await ethers.getContractAt(
      "GovernorContract",
      governorContractAddress
    );
    const tokenContract = await ethers.getContractAt("GovernanceToken", tokenContractAddress);
    // console.log("Governor Contract:", governorContract);
    const proposalThreshold = await governorContract.proposalThreshold();
    console.log("Proposal Threshold:", proposalThreshold.toString());
    
    const quorum = await governorContract.quorumVotes();
    const votingPeriod = await governorContract.votingPeriod();
    const proposalDelay = await governorContract.votingDelay();

    const tokenName = await tokenContract.name();
    const tokenSymbol = await tokenContract.symbol();

    res.status(200).json({
      proposalThreshold: proposalThreshold.toString(),
      quorum: quorum.toString(),
      votingPeriod: votingPeriod.toString(),
      proposalDelay: proposalDelay.toString(),
      tokenName,
      tokenSymbol,
    });
  } catch (e) {
    console.error("Error fetching governor settings:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { getGovernorSettings };

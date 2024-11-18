const fs = require("fs");
const path = require("path");
const {
  networkConfig,
  developmentChains,
  VOTING_PERIOD,
  VOTING_DELAY,
  QUORUM_PERCENTAGE,
  PROPOSAL_THRESHOLD,
} = require("../helper-hardhat-config");

const { network, ethers } = require("hardhat");

const getGovernorSettings = async (req, res) => {
  try {
    res.status(200).json({
      proposalThreshold: PROPOSAL_THRESHOLD,
      quorumPercentage: QUORUM_PERCENTAGE,
      votingPeriod: VOTING_PERIOD,
      votingDelay: VOTING_DELAY,
    });

    // const networkFolderMap = {
    //   hardhat: "localhost",
    // };

    // const folderName = networkFolderMap[network.name] || network.name;

    // const governorPath = path.join(__dirname, "../deployments", folderName, "GovernorContract.json");
    // const tokenPath = path.join(__dirname, "../deployments", folderName, "GovernanceToken.json");

    // console.log("Governor Path:", governorPath);

    // // Ensure deployment files exist
    // if (!fs.existsSync(governorPath) || !fs.existsSync(tokenPath)) {
    //   return res.status(404).json({ error: "Contract addresses not found for this network." });
    // }

    // const governorContractAddress = JSON.parse(fs.readFileSync(governorPath, "utf8")).address;
    // const tokenContractAddress = JSON.parse(fs.readFileSync(tokenPath, "utf8")).address;

    // console.log("Governor Contract Address:", governorContractAddress);
    // console.log("Token Contract Address:", tokenContractAddress);

    // // Fetch the contract instances
    // const governorContract = await ethers.getContractAt(
    //   "GovernorContract",
    //   governorContractAddress
    // );
    // const tokenContract = await ethers.getContractAt("GovernanceToken", tokenContractAddress);

    // // Ensure you're awaiting the async calls
    // const votingPeriod = await governorContract.votingPeriod();  // Await this call
    // const proposalDelay = await governorContract.votingDelay();  // Await this call
    // const tokenSupply = await tokenContract.totalSupply();  // Await this call
    // const proposalThreshold = await governorContract.proposalThreshold();  // Await this call

    // console.log("Voting Period:", votingPeriod.toString());
    // console.log("Proposal Delay:", proposalDelay.toString());
    // console.log("Token Supply:", tokenSupply.toString());
    // console.log("Proposal Threshold:", proposalThreshold.toString());

    // Respond with the correct data
    // res.status(200).json({
    //   proposalThreshold: proposalThreshold.toString(),
    //   quorum: QUORUM_PERCENTAGE * tokenSupply,
    //   votingPeriod: votingPeriod.toString(),
    //   proposalDelay: proposalDelay.toString(),
    // });
  } catch (e) {
    console.error("Error fetching governor settings:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { getGovernorSettings };

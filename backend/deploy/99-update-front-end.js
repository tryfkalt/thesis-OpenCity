const {
  frontEndContractsGovernor,
  frontEndAbiFileHazardProposal,
  frontEndAbiFileGovernor,
  frontEndContractsHazard,
} = require("../helper-hardhat-config");
const fs = require("fs");
const { network, ethers } = require("hardhat");

module.exports = async () => {
  if (process.env.UPDATE_FRONT_END) {
    console.log("Updating the front end...");
    await updateContractAddresses();
    await updateAbi();
    console.log("Front end updated!");
  }
};

async function updateAbi() {
  // Update ABI for Governor contract
  const governor = await ethers.getContract("GovernorContract");
  fs.writeFileSync(
    frontEndAbiFileGovernor,
    governor.interface.format(ethers.utils.FormatTypes.json)
  );
  // Update ABI for HazardProposal contract
  const hazardProposal = await ethers.getContract("HazardProposal");
  fs.writeFileSync(
    frontEndAbiFileHazardProposal,
    hazardProposal.interface.format(ethers.utils.FormatTypes.json)
  );

  console.log("ABIs updated in front end.");
}

async function updateContractAddresses() {
  const governor = await ethers.getContract("GovernorContract");
  const hazardProposal = await ethers.getContract("HazardProposal");

  // Load the existing contract addresses JSON files
  const governorAddresses = JSON.parse(fs.readFileSync(frontEndContractsGovernor, "utf8"));
  const hazardAddresses = JSON.parse(fs.readFileSync(frontEndContractsHazard, "utf8"));
  const chainId = network.config.chainId.toString();

  // Update the address for the Governor contract
  if (chainId in governorAddresses) {
    if (!governorAddresses[chainId].includes(governor.address)) {
      governorAddresses[chainId] = governor.address;
    }
  } else {
    governorAddresses[chainId] = [governor.address];
  }

  // Update the address for the HazardProposal contract
  if (chainId in hazardAddresses) {
    if (!hazardAddresses[chainId].includes(hazardProposal.address)) {
      hazardAddresses[chainId] = hazardProposal.address;
    }
  } else {
    hazardAddresses[chainId] = [hazardProposal.address];
  }

  // Write the updated addresses back to the files
  fs.writeFileSync(frontEndContractsGovernor, JSON.stringify(governorAddresses, null, 2));
  fs.writeFileSync(frontEndContractsHazard, JSON.stringify(hazardAddresses, null, 2));
  console.log("Contract addresses updated in front end.");
}

module.exports.tags = ["all", "frontend"];

const {
  frontEndContractsGovernor,
  frontEndAbiFileProposalContract,
  frontEndAbiFileGovernor,
  frontEndContractsProposalContract,
  frontEndAbiFileGovernanceToken,
  frontendContractsGovernanceToken,
  // frontendAbiFileTokenExchange,
  // frontendContractsTokenExchange,
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
  // Update ABI for ProposalContract
  const proposalContract = await ethers.getContract("ProposalContract");
  fs.writeFileSync(
    frontEndAbiFileProposalContract,
    proposalContract.interface.format(ethers.utils.FormatTypes.json)
  );

  // Update ABI for GovernanceToken contract
  const governanceToken = await ethers.getContract("GovernanceToken");
  fs.writeFileSync(
    frontEndAbiFileGovernanceToken,
    governanceToken.interface.format(ethers.utils.FormatTypes.json)
  );

  // // Update ABI for TokenExchange contract
  // const tokenExchange = await ethers.getContract("TokenExchange");
  // fs.writeFileSync(
  //   frontendAbiFileTokenExchange,
  //   tokenExchange.interface.format(ethers.utils.FormatTypes.json)
  // );

  console.log("ABIs updated in front end.");
}

async function updateContractAddresses() {
  const governor = await ethers.getContract("GovernorContract");
  const proposalContract = await ethers.getContract("ProposalContract");
  const governanceToken = await ethers.getContract("GovernanceToken");
  // const tokenExchange = await ethers.getContract("TokenExchange");

  // Load the existing contract addresses JSON files
  const governorAddresses = JSON.parse(fs.readFileSync(frontEndContractsGovernor, "utf8"));
  const proposalContractAddresses = JSON.parse(fs.readFileSync(frontEndContractsProposalContract, "utf8"));
  const governanceTokenAddresses = JSON.parse(
    fs.readFileSync(frontendContractsGovernanceToken, "utf8")
  );
  // const tokenExchangeAddresses = JSON.parse(
  //   fs.readFileSync(frontendContractsTokenExchange, "utf8")
  // );
  const chainId = network.config.chainId.toString();

  // Update the address for the Governor contract
  if (chainId in governorAddresses) {
    if (!governorAddresses[chainId].includes(governor.address)) {
      governorAddresses[chainId] = governor.address;
    }
  } else {
    governorAddresses[chainId] = [governor.address];
  }

  // Update the address for the ProposalContract contract
  if (chainId in proposalContractAddresses) {
    if (!proposalContractAddresses[chainId].includes(proposalContract.address)) {
      proposalContractAddresses[chainId] = proposalContract.address;
    }
  } else {
    proposalContractAddresses[chainId] = [proposalContract.address];
  }

  // Update the address for the GovernanceToken contract
  if (chainId in governanceTokenAddresses) {
    if (!governanceTokenAddresses[chainId].includes(governanceToken.address)) {
      governanceTokenAddresses[chainId] = governanceToken.address;
    }
  } else {
    governanceTokenAddresses[chainId] = [governanceToken.address];
  }

  // // Update the address for the TokenExchange contract
  // if (chainId in tokenExchangeAddresses) {
  //   if (!tokenExchangeAddresses[chainId].includes(tokenExchange.address)) {
  //     tokenExchangeAddresses[chainId] = tokenExchange.address;
  //   }
  // } else {
  //   tokenExchangeAddresses[chainId] = [tokenExchange.address];
  // }

  // Write the updated addresses back to the files
  fs.writeFileSync(frontEndContractsGovernor, JSON.stringify(governorAddresses, null, 2));
  fs.writeFileSync(frontEndContractsProposalContract, JSON.stringify(proposalContractAddresses, null, 2));
  fs.writeFileSync(
    frontendContractsGovernanceToken,
    JSON.stringify(governanceTokenAddresses, null, 2)
  );
  // fs.writeFileSync(frontendContractsTokenExchange, JSON.stringify(tokenExchangeAddresses, null, 2));
  console.log("Contract addresses updated in front end.");
}

module.exports.tags = ["all", "frontend"];

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { networkConfig, developmentChains, VOTING_PERIOD, VOTING_DELAY, QUORUM_PERCENTAGE, PROPOSAL_THRESHOLD } from "../helper-hardhat-config";
import verify from "../helper-functions";

const deployGovernorContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments, network } = hre;
    const { deploy, log, get } = deployments;
    const { deployer } = await getNamedAccounts();
    const governanceToken = await get("GovernanceToken");
    const timeLock = await get("TimeLock");
    log("Deploying Governor contract...");

    const governorContract = await deploy("GovernorContract", {
        from: deployer,
        args: [governanceToken.address, timeLock.address, QUORUM_PERCENTAGE, VOTING_PERIOD, VOTING_DELAY, PROPOSAL_THRESHOLD],
        log: true,
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    });
    log("GovernorContract deployed to: " + governorContract.address);
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(governorContract.address, [governanceToken.address, timeLock.address, QUORUM_PERCENTAGE, VOTING_PERIOD, VOTING_DELAY, PROPOSAL_THRESHOLD], "contracts/governance_standard/GovernorContract.sol:GovernorContract");
    };
}

export default deployGovernorContract;
deployGovernorContract.tags = ["all", "governor"]
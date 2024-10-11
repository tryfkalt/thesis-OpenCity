import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { networkConfig, developmentChains, MIN_DELAY } from "../helper-hardhat-config";
import { ethers } from "hardhat";
import verify from "../helper-functions";

const deployTimeLock: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments, network } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    log("Deploying TimeLock...");

    const timeLock = await deploy("TimeLock", {
        from: deployer,
        args: [MIN_DELAY, [], [], deployer],
        log: true,
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    });
    log("TimeLock deployed to: " + timeLock.address);
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(timeLock.address, [MIN_DELAY, [], [], deployer], "contracts/governance_standard/TimeLock.sol:TimeLock");
    };
};

export default deployTimeLock;
deployTimeLock.tags = ["all", "timelock"];
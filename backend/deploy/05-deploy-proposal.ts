import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import verify from "../helper-functions";
import { ethers } from "hardhat";
import { networkConfig, developmentChains } from "../helper-hardhat-config";

const deployProposal: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments, network } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    log("Deploying Proposal contract...and wait for confirmations");

    const proposal = await deploy('HazardProposal', {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    });

    log("Proposal deployed to: " + proposal.address);
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(proposal.address, []);
    };
    const proposalContract = await ethers.getContractAt("HazardProposal", proposal.address);
    const currentOwner = await proposalContract.owner();
    console.log("Current owner of the contract is: ", currentOwner);
    if (currentOwner.toLowerCase() !== deployer.toLowerCase()) {
        throw new Error("The deployer is not the owner of the contract");
    }

    const timeLock = await ethers.getContract("TimeLock");
    const transferTx = await proposalContract.transferOwnership(timeLock.address);
    await transferTx.wait(1);
}

export default deployProposal;
deployProposal.tags = ["all", "proposal"];
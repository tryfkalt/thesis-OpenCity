import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ADDRESS_ZERO } from "../helper-hardhat-config";
import { ethers } from "hardhat";

const setupContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments } = hre;
    const { log } = deployments;
    const [deployer] = await ethers.getSigners();
    console.log("Deployer Address:", deployer.address);

    log("----------------------------------------------------");
    log("Setting up contracts for roles...");

    // Get the deployed TimeLock and GovernorContract instances using getContractAt
    const timeLockAddress = (await deployments.get("TimeLock")).address;
    const governorAddress = (await deployments.get("GovernorContract")).address;

    const timeLock = await ethers.getContractAt("TimeLock", timeLockAddress);
    const governor = await ethers.getContractAt("GovernorContract", governorAddress);

    const proposerRole = await timeLock.PROPOSER_ROLE();
    const executorRole = await timeLock.EXECUTOR_ROLE();
    const adminRole = await timeLock.TIMELOCK_ADMIN_ROLE();

    // Check if the deployer has the admin role
    const isAdmin = await timeLock.hasRole(adminRole, deployer.address);
    console.log("Is Deployer Admin:", isAdmin);
    console.log("Deploying from account:", deployer.address);

    if (!isAdmin) {
        console.log("Granting adminRole to deployer...");
        const tx = await timeLock.grantRole(adminRole, deployer.address);
        await tx.wait();
    }

    // Grant roles first
    const proposerTx = await timeLock.grantRole(proposerRole, governor.address);
    await proposerTx.wait(1);

    const executorTx = await timeLock.grantRole(executorRole, ADDRESS_ZERO);
    await executorTx.wait(1);

    // Then revoke the admin role if necessary
    const revokeTx = await timeLock.revokeRole(adminRole, deployer.address);
    await revokeTx.wait(1);

    // Now, anything the timeLock wants to do has to go through the governance process!
}

export default setupContracts;
setupContracts.tags = ["all", "setup"];

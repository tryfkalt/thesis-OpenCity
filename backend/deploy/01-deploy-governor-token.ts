import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { developmentChains, networkConfig } from '../helper-hardhat-config';
import verify from "../helper-functions";
import { ethers } from 'hardhat';

/**
 * Deploys the GovernanceToken contract and handles post-deployment tasks such as verification and delegation.
 *
 * @param {HardhatRuntimeEnvironment} hre - The Hardhat runtime environment.
 * @returns {Promise<void>} - A promise that resolves when the deployment and post-deployment tasks are complete.
 *
 * @remarks
 * This function performs the following steps:
 * 1. Retrieves named accounts and deployment utilities from the Hardhat runtime environment.
 * 2. Deploys the GovernanceToken contract using the deployer account.
 * 3. Logs the deployed contract address.
 * 4. Verifies the contract on Etherscan if the deployment is on a non-development chain.
 * 5. Delegates voting power to the deployer account.
 *
 * @example
 * await deployGovernanceToken(hre);
 */
const deployGovernanceToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments, network } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    log("Deploying GovernanceToken...");
    const governanceToken = await deploy("GovernanceToken", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    });

    log("GovernanceToken deployed to: " + governanceToken.address);

    // Only verify in non-development chains
    if (!developmentChains.includes(network.name)) {
        await verify(governanceToken.address, [], "contracts/GovernanceToken.sol:GovernanceToken");
    }

    // Delegate voting power to the deployer account
    log(`Delegating voting power to ${deployer}...`);
    await delegate(governanceToken.address, deployer);
    log("Delegation complete!");
};

const delegate = async (governanceTokenAddress: string, delegatedAccount: string) => {
    const governanceToken = await ethers.getContractAt("GovernanceToken", governanceTokenAddress);
    const transactionResponse = await governanceToken.delegate(delegatedAccount);
    await transactionResponse.wait();
    console.log(`Checkpoints after delegation: ${await governanceToken.numCheckpoints(delegatedAccount)}`);
};

export default deployGovernanceToken;
deployGovernanceToken.tags = ["all", "governor"];

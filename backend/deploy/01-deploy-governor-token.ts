import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { developmentChains, networkConfig } from '../helper-hardhat-config';
import verify from "../helper-functions";
import { ethers } from 'hardhat';

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

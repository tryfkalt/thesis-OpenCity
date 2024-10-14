import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import verify from "../helper-functions"
import { networkConfig, developmentChains } from "../helper-hardhat-config"
import { ethers } from "hardhat"

const deployProposal: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // @ts-ignore
  const { getNamedAccounts, deployments, network } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  log("----------------------------------------------------")
  log("Deploying Box and waiting for confirmations...")
  const proposal = await deploy("HazardProposal", {
    from: deployer,
    args: [],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
  })
  log(`Proposal at ${proposal.address}`)
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    await verify(proposal.address, [], "contracts/HazardProposal.sol:HazardProposal")
  }
  const proposalContract = await ethers.getContractAt("HazardProposal", proposal.address)
  const timeLock = await ethers.getContract("TimeLock")
  const transferTx = await proposalContract.transferOwnership(timeLock.address)
  await transferTx.wait(1)
}

export default deployProposal
deployProposal.tags = ["all", "box"]
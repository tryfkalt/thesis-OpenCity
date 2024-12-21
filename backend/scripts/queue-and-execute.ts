
import { ethers, network } from "hardhat"
import {
    FUNC,
    PROPOSAL_DESCRIPTION,
    MIN_DELAY,
    developmentChains,
    STORE_PARAMS,
} from "../helper-hardhat-config"
import { moveBlocks } from "../utils/move-blocks"
import { moveTime } from "../utils/move-time"

/**
 * Asynchronously queues and executes a function call on a smart contract.
 * 
 * This function performs the following steps:
 * 1. Retrieves the contract instance of "ProposalContract".
 * 2. Encodes the function call with the provided arguments.
 * 3. Computes the description hash for the proposal.
 * 4. Retrieves the contract instance of "GovernorContract".
 * 5. Queues the proposal for execution.
 * 6. If on a development chain, advances the blockchain time and blocks.
 * 7. Executes the queued proposal.
 * 8. Logs all proposals from the "ProposalContract".
 * 
 * @async
 * @function
 * @returns {Promise<void>} A promise that resolves when the function completes.
 * 
 * @throws Will throw an error if the contract interactions fail.
 */
export async function queueAndExecute() {
    const args = STORE_PARAMS
    const functionToCall = FUNC
    const box = await ethers.getContract("ProposalContract")
    const encodedFunctionCall = box.interface.encodeFunctionData(functionToCall, args)
    const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(PROPOSAL_DESCRIPTION))

    const governor = await ethers.getContract("GovernorContract")
    console.log("Queueing...")
    const queueTx = await governor.queue([box.address], [0], [encodedFunctionCall], descriptionHash)
    await queueTx.wait(1)

    if (developmentChains.includes(network.name)) {
        await moveTime(MIN_DELAY + 1)
        await moveBlocks(1)
    }

    console.log("Executing...")
    const executeTx = await governor.execute(
        [box.address],
        [0],
        [encodedFunctionCall],
        descriptionHash
    )
    await executeTx.wait(1)
    console.log(`Proposals: ${await box.getAllProposals()}`)
}

queueAndExecute()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })

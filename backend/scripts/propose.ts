
import { ethers, network } from "hardhat";
import { FUNC, PROPOSAL_DESCRIPTION, developmentChains, VOTING_DELAY, proposalsFile, STORE_PARAMS } from "../helper-hardhat-config";
import { moveBlocks } from "../utils/move-blocks";
import * as fs from "fs";

async function propose(args: any, functionToCall: string, proposalDescription: string) {
    
    const governor = await ethers.getContract("GovernorContract");
    const box = await ethers.getContract("HazardProposal");
    // console.log(box);
    // this is the calldata on the propose function
    const encodedFunctionCall = box.interface.encodeFunctionData(functionToCall, args);
    console.log(`Proposing ${functionToCall} on ${box.address} with args: ${args}`);
    console.log(`Proposal description: \n ${PROPOSAL_DESCRIPTION}`);
    const proposeTx = await governor.propose([box.address], [0], [encodedFunctionCall], proposalDescription);

    if (developmentChains.includes(network.name)) {
        await moveBlocks(VOTING_DELAY + 1);
        // VOTING_DELAY is the number of blocks that need to pass before voting can begin
    }
    const proposeReceipt = await proposeTx.wait(1);
    const proposalId = proposeReceipt.events![0].args!.proposalId;
    // the proposalId is the id of the proposal that was just created
    const proposalState = await governor.state(proposalId);
    // the state of the proposal is the current state of the proposal. It can be 0 (Pending), 1 (Active), 2 (Canceled), 3 (Defeated), 4 (Succeeded), 5 (Queued), 6 (Expired), 7 (Executed)
    const proposalSnapShot = await governor.proposalSnapshot(proposalId);
    // the proposal snapshot is the block number at which the proposal was created
    const proposalDeadline = await governor.proposalDeadline(proposalId);
    // the proposal deadline is the block number at which the proposal will expire
    // save the proposalId
    storeProposalId(proposalId);


    console.log(`Current Proposal State: ${proposalState}`)
    // What block # the proposal was snapshot
    console.log(`Current Proposal Snapshot: ${proposalSnapShot}`)
    // The block number the proposal voting expires
    console.log(`Current Proposal Deadline: ${proposalDeadline}`)

    // return {
    //     proposalId: proposalId.toString(),
    //     proposalState,
    //     proposalSnapShot,
    //     proposalDeadline,
    // };
}

async function storeProposalId(proposalId: any) {
    const chainId = network.config.chainId!.toString();
    let proposals: any;

    if (fs.existsSync(proposalsFile)) {
        proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));
    } else {
        proposals = {};
        proposals[chainId] = [];
    }
    // console.log(proposals);
    proposals[chainId].push(proposalId.toString());
    fs.writeFileSync(proposalsFile, JSON.stringify(proposals), "utf8");
}

propose(STORE_PARAMS, FUNC, PROPOSAL_DESCRIPTION).then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});

module.exports = { propose, storeProposalId }; 
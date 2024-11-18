import * as fs from "fs";
import { network, ethers } from "hardhat";
import { proposalsFile, developmentChains, VOTING_PERIOD } from "../helper-hardhat-config";
import { moveBlocks } from "../utils/move-blocks";

async function main() {
  const proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));
  // Get the last proposal for the network. You could also change it for your index
  const proposalId = proposals[network.config.chainId!].at(-1);
  
  const voteWay = 1; // 0 = Against, 1 = For, 2 = Abstain for this example
  const reason = "Excellent Proposal!";
  await vote(proposalId, voteWay, reason);
}

// 0 = Against, 1 = For, 2 = Abstain for this example
export async function vote(proposalId: string, voteWay: number, reason: string) {
  console.log("Voting...");

  const governor = await ethers.getContract("GovernorContract");
  const voter = (await ethers.getSigners())[0].address; // Get the voter's address
  
  // Cast the vote with reason
  const voteTx = await governor.castVoteWithReason(proposalId, voteWay, reason);
  const voteTxReceipt = await voteTx.wait(1);
  console.log(`Vote reason: ${voteTxReceipt.events[0].args.reason}`);

  // Get the proposal snapshot block number
  const proposalSnapshot = await governor.proposalSnapshot(proposalId);
  console.log(`Proposal snapshot block: ${proposalSnapshot}`);

  // Debug: Check the voter's voting power at the snapshot block
  const voterPower = await governor.getVotes(voter, proposalSnapshot);
  console.log(`Voter ${voter} has ${voterPower.toString()} votes at block ${proposalSnapshot}.`);

  // Debug: Check the total token supply at the snapshot block
  const tokenContract = await ethers.getContract("GovernanceToken"); 
  const totalSupply = await tokenContract.getPastTotalSupply(proposalSnapshot);
  console.log(`Total token supply at block ${proposalSnapshot}: ${totalSupply.toString()}`);

  // Debug: Check the quorum required at the snapshot block
  const quorumRequired = await governor.quorum(proposalSnapshot);
  console.log(`Quorum required at block ${proposalSnapshot}: ${quorumRequired.toString()}`);

  // Debug: Check the current state of the proposal
  const proposalState = await governor.state(proposalId);
  console.log(`Current proposal state: ${proposalState} (0 = Pending, 1 = Active, 4 = Succeeded)`);

  // If on a development chain, move the blocks forward past the voting period
  if (developmentChains.includes(network.name)) {
    await moveBlocks(VOTING_PERIOD + 1);
  }

  // After vote: Check the updated proposal state
  const updatedState = await governor.state(proposalId);
  console.log(`Updated proposal state: ${updatedState} (4 = Succeeded)`);

  // Debug: Check the vote count for "For", "Against", and "Abstain"
  const proposalVotes = await governor.proposalVotes(proposalId);
  console.log(`Votes For: ${proposalVotes.forVotes.toString()}`);
  console.log(`Votes Against: ${proposalVotes.againstVotes.toString()}`);
  console.log(`Abstain Votes: ${proposalVotes.abstainVotes.toString()}`);

  console.log("Vote Submitted!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

import { ethers } from "hardhat";

async function main() {
  const [deployer, user1, user2] = await ethers.getSigners();

  const governanceToken = await ethers.getContract("GovernanceToken");

  // Mint tokens to users (user1, user2)
  const mintAmount = ethers.utils.parseUnits("100", 18); // Mint 100 tokens to each user
  await governanceToken.mint(user1.address, mintAmount);
  await governanceToken.mint(user2.address, mintAmount);

  console.log(`Minted ${mintAmount} TryfTokens to ${user1.address}`);
  console.log(`Minted ${mintAmount} TryfTokens to ${user2.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

const { ethers } = require("hardhat");

async function manualWithdraw() {
    const [deployer] = await ethers.getSigners(); // Get the deployer's wallet
    const governanceTokenAddress = "0x3Fb89FCF546082DA1248E1e655A5b5bEa6378D72"; // Replace with deployed contract address
    const governanceToken = await ethers.getContractAt("GovernanceToken", governanceTokenAddress);

    const userAddress = "0x1c6eB07DA3b40121F42bE28a043329CD4E1Bf2e5"; // Replace with the user's wallet address
    const tokenAmountToSell = ethers.utils.parseUnits("50", 18); // Replace with the amount the user wants to sell

    // Define exchange rate (same as contract's exchange rate)
    const exchangeRate = 100; // 1 ETH = 100 TT
    const ethAmount = tokenAmountToSell.mul(ethers.BigNumber.from(1)).div(exchangeRate);

    // Check the user's token balance
    const userBalance = await governanceToken.balanceOf(userAddress);
    if (userBalance.lt(tokenAmountToSell)) {
        console.error("User does not have enough tokens.");
        return;
    }

    // Transfer tokens from the user to the deployer
    const transferTx = await governanceToken
        .connect(deployer)
        .transferFrom(userAddress, deployer.address, tokenAmountToSell);
    await transferTx.wait();
    console.log(`Transferred ${ethers.utils.formatUnits(tokenAmountToSell, 18)} TT from user to deployer.`);

    // Send ETH to the user
    const ethTx = await deployer.sendTransaction({
        to: userAddress,
        value: ethAmount,
    });
    await ethTx.wait();
    console.log(`Sent ${ethers.utils.formatEther(ethAmount)} ETH to the user.`);
}

manualWithdraw()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
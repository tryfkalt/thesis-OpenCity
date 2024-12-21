// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract GovernanceToken is ERC20Votes {
  uint256 public s_maxTokens = 10000; // Max supply set to 10,000 TT
  uint256 public maxExchangeAmount = 250; // Max exchangeable amount per user in TT
  uint256 public exchangeRate = 100; // 1 ETH = 100 TT
  address public deployer;

  constructor() ERC20("TryfToken", "TT") ERC20Permit("TryfToken") {
    deployer = msg.sender;
    _mint(deployer, s_maxTokens); // Mint the entire supply to the deployer
  }

  // Exchange function: Allows users to buy tokens with ETH up to maxExchangeAmount limit
  function buyTokens() external payable {
    require(msg.value > 0, "Must send ETH to buy tokens.");
    uint256 tokenAmount = msg.value * exchangeRate / 1 ether; // Calculate TT amount based on rate

    // Check if the user will exceed max allowed tokens after this purchase
    require(
      balanceOf(msg.sender) + tokenAmount <= maxExchangeAmount,
      "Purchase would exceed max allowed tokens."
    );
    require(balanceOf(deployer) >= tokenAmount, "Not enough tokens available for exchange.");

    _transfer(deployer, msg.sender, tokenAmount);
  }

  // Allow deployer to withdraw collected ETH
  function withdrawETH() external {
    require(msg.sender == deployer, "Only deployer can withdraw.");
    payable(deployer).transfer(address(this).balance);
  }

  // Function to get the balance of the deployer
  function getDeployerBalance() external view returns (uint256) {
    return balanceOf(deployer);
  }

  // Overrides for ERC20Votes compatibility
  function _afterTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal override(ERC20Votes) {
    super._afterTokenTransfer(from, to, amount);
  }

  function _mint(address to, uint256 amount) internal override(ERC20Votes) {
    super._mint(to, amount);
  }

  function _burn(address account, uint256 amount) internal override(ERC20Votes) {
    super._burn(account, amount);
  }
}

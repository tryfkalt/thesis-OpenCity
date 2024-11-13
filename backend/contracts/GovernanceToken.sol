// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract GovernanceToken is ERC20Votes {
  uint256 public s_maxTokens = 10000;
  uint256 public maxClaimAmount = 1000; // Maximum claimable amount per user
  address public deployer;
  mapping(address => uint256) public claimedAmount; // Track claimed amount per user

  constructor() ERC20("TryfToken", "TT") ERC20Permit("TryfToken") {
    deployer = msg.sender;
    _mint(deployer, s_maxTokens); // Mint the entire supply to the deployer
  }

  // Function for users to claim tokens up to a maximum claim amount
  function claimTokens(uint256 amount) external {
    require(amount > 0, "Claim amount must be greater than zero.");
    require(claimedAmount[msg.sender] + amount <= maxClaimAmount, "Claim amount exceeds limit.");
    require(balanceOf(deployer) >= amount, "Not enough tokens to claim."); // Ensure deployer has enough tokens

    claimedAmount[msg.sender] += amount;
    _transfer(deployer, msg.sender, amount); // Transfer from deployer to user
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

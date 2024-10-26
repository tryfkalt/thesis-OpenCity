// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract GovernanceToken is ERC20Votes {
  uint256 public s_maxTokens = 10000;
  mapping(address => bool) public claimed;

  constructor() ERC20("TryfToken", "TT") ERC20Permit("TryfToken") {
    _mint(msg.sender, s_maxTokens);
  }

  // Function for users to claim tokens
  function claimTokens() external {
    require(!claimed[msg.sender], "Tokens already claimed.");
    claimed[msg.sender] = true;
    _mint(msg.sender, 500); // Mint 100 tokens per user
  }

  function _mint(address to, uint256 amount) internal override(ERC20Votes) {
    super._mint(to, amount);
  }

  function _burn(address account, uint256 amount) internal override(ERC20Votes) {
    super._burn(account, amount);
  }

  function _afterTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal override(ERC20Votes) {
    super._afterTokenTransfer(from, to, amount);
  }
}

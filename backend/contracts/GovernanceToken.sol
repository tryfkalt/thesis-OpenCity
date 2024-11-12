// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract GovernanceToken is ERC20Votes {
    uint256 public s_maxTokens = 10000;
    address public deployer;
    mapping(address => bool) public claimed;

    constructor() ERC20("TryfToken", "TT") ERC20Permit("TryfToken") {
        deployer = msg.sender;
        _mint(deployer, s_maxTokens); // Mint the entire supply to the deployer
    }

    // Function for users to claim tokens without increasing the total supply
    function claimTokens() external {
        require(!claimed[msg.sender], "Tokens already claimed.");
        require(balanceOf(deployer) >= 500, "Not enough tokens to claim."); // Ensure deployer has enough tokens

        claimed[msg.sender] = true;
        _transfer(deployer, msg.sender, 500); // Transfer from deployer to user
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

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/governance/TimelockController.sol";

contract TimeLock is TimelockController {
  constructor(
    uint256 minDelay, // Minimum delay before an operation can be executed
    address[] memory proposers, // Addresses allowed to propose operations
    address[] memory executors, // Addresses allowed to execute operations
    address admin // Address of the admin (deployer)
  ) TimelockController(minDelay, proposers, executors) {
  }
}

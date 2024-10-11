// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/governance/TimelockController.sol";

contract TimeLock is TimelockController {
    // TimeLock constructor where deployer is assigned the admin role
    constructor(
        uint256 minDelay,           // Minimum delay before an operation can be executed
        address[] memory proposers, // Addresses allowed to propose operations
        address[] memory executors, // Addresses allowed to execute operations
        address admin               // Address of the admin (deployer)
    )
        TimelockController(minDelay, proposers, executors)
    {
        // Grant the deployer (admin) the TIMELOCK_ADMIN_ROLE
        _setupRole(TIMELOCK_ADMIN_ROLE, admin);

        // Optionally revoke the contract's self-admin role if you don't want self-administration:
        // _revokeRole(TIMELOCK_ADMIN_ROLE, address(this)); // Optional: self-administration
    }
}

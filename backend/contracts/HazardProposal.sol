// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract HazardProposal is Ownable {
  uint256[] private hazardList;

  event HazardAdded(uint256 newElementId);

  constructor() Ownable() {}

  /**
   * @dev Store a new element ID in the hazard list.
   * Can only be called by the owner of the contract.
   * @param newElementId The ID of the new element to store.
   */
  function addHazard(uint256 newElementId) public onlyOwner {
    hazardList.push(newElementId);
    emit HazardAdded(newElementId);
  }

  /**
   * @dev Retrieve an element ID from the hazard list.
   * Emits an event with the retrieved element ID.
   * @param index The index of the element to retrieve.
   * @return The element ID at the specified index.
   */
  function getHazard(uint256 index) public view returns (uint256) {
    require(index < hazardList.length, "Index out of bounds");
    uint256 retrievedElementId = hazardList[index];
    return retrievedElementId;
  }

  /**
   * @dev Retrieve the first element ID from the hazard list.
   * Emits an event with the retrieved element ID.
   * @return The first element ID in the hazard list.
   */
  function getFirstHazard() public view returns (uint256) {
    require(hazardList.length > 0, "Hazard list is empty");
    uint256 retrievedElementId = hazardList[0];
    return retrievedElementId;
  }

  /**
   * @dev Retrieve the entire hazard list.
   * @return The array of all hazard element IDs.
   */
  function getAllHazards() public view returns (uint256[] memory) {
    return hazardList;
  }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract HazardProposal is Ownable {
    // Struct to hold hazard data
    struct Hazard {
        uint256 id;
        string title;
        string description;
        int256 latitude;
        int256 longitude;
    }

    // Mapping to store hazards by ID
    mapping(uint256 => Hazard) public hazards;
    uint256 public hazardCount;

    // Event to log the addition of a new hazard
    event HazardAdded(uint256 hazardId, string title, string description, int256 latitude, int256 longitude);

    constructor() {}

    /**
     * @dev Store a new hazard in the contract.
     * Can only be called by the owner of the contract.
     * @param _title The title of the hazard.
     * @param _description The description of the hazard.
     * @param _latitude The latitude of the hazard's location.
     * @param _longitude The longitude of the hazard's location.
     */
    function storeHazard(
        string memory _title,
        string memory _description,
        int256 _latitude,
        int256 _longitude
    ) public onlyOwner {
        hazards[hazardCount] = Hazard({
            id: hazardCount,
            title: _title,
            description: _description,
            latitude: _latitude,
            longitude: _longitude
        });
        
        emit HazardAdded(hazardCount, _title, _description, _latitude, _longitude);
        
        // Increment hazard count after storing
        hazardCount++;
    }

    function getHazard(uint256 _id) public view returns (
        uint256 id,
        string memory title,
        string memory description,
        int256 latitude,
        int256 longitude
    ) {
        Hazard storage hazard = hazards[_id];
        return (
            hazard.id,
            hazard.title,
            hazard.description,
            hazard.latitude,
            hazard.longitude
        );
    }

    /**
     * @dev Retrieve all hazards' details.
     * @return Array of all hazards stored in the contract.
     */
    function getAllHazards() public view returns (Hazard[] memory) {
        Hazard[] memory allHazards = new Hazard[](hazardCount);
        for (uint256 i = 0; i < hazardCount; i++) {
            allHazards[i] = hazards[i];
        }
        return allHazards;
    }
}

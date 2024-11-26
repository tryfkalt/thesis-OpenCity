// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ProposalContract is Ownable {
    // Struct to hold proposal data
    struct Proposal {
        uint256 id;
        string title;
        string description;
        int256 latitude;
        int256 longitude;
    }

    // Mapping to store proposals by ID
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    // Event to log the addition of a new proposal
    event ProposalAdded(uint256 proposalId, string title, string description, int256 latitude, int256 longitude);

    constructor() {}

    /**
     * @dev Store a new proposal in the contract.
     * Can only be called by the owner of the contract.
     * @param _title The title of the proposal.
     * @param _description The description of the proposal.
     * @param _latitude The latitude of the proposal's location.
     * @param _longitude The longitude of the proposal's location.
     */
    function storeProposal(
        string memory _title,
        string memory _description,
        int256 _latitude,
        int256 _longitude
    ) public onlyOwner {
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            title: _title,
            description: _description,
            latitude: _latitude,
            longitude: _longitude
        });
        
        emit ProposalAdded(proposalCount, _title, _description, _latitude, _longitude);
        
        // Increment proposal count after storing
        proposalCount++;
    }

    function getProposal(uint256 _id) public view returns (
        uint256 id,
        string memory title,
        string memory description,
        int256 latitude,
        int256 longitude
    ) {
        Proposal storage proposal = proposals[_id];
        return (
            proposal.id,
            proposal.title,
            proposal.description,
            proposal.latitude,
            proposal.longitude
        );
    }

    /**
     * @dev Retrieve all proposals' details.
     * @return Array of all proposals stored in the contract.
     */
    function getAllProposals() public view returns (Proposal[] memory) {
        Proposal[] memory allProposals = new Proposal[](proposalCount);
        for (uint256 i = 0; i < proposalCount; i++) {
            allProposals[i] = proposals[i];
        }
        return allProposals;
    }
}

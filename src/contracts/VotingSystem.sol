// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract VotingSystem is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ELECTION_OFFICER_ROLE = keccak256("ELECTION_OFFICER_ROLE");

    struct Election {
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        uint256 totalVotes;
        address creator;
    }

    struct Candidate {
        string name;
        string description;
        string partyAffiliation;
        uint256 voteCount;
        bool isActive;
    }

    struct Vote {
        uint256 electionId;
        uint256 candidateId;
        bytes32 voterHash;
        uint256 timestamp;
    }

    mapping(uint256 => Election) public elections;
    mapping(uint256 => mapping(uint256 => Candidate)) public candidates;
    mapping(uint256 => mapping(bytes32 => bool)) public hasVoted;
    mapping(uint256 => uint256) public candidateCount;
    mapping(uint256 => Vote[]) public electionVotes;

    uint256 public electionCount;

    event ElectionCreated(uint256 indexed electionId, string title, uint256 startTime, uint256 endTime);
    event CandidateAdded(uint256 indexed electionId, uint256 indexed candidateId, string name);
    event VoteCast(uint256 indexed electionId, uint256 indexed candidateId, bytes32 voterHash, uint256 timestamp);
    event ElectionEnded(uint256 indexed electionId, uint256 timestamp);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function createElection(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime
    ) external onlyRole(ELECTION_OFFICER_ROLE) returns (uint256) {
        require(_startTime < _endTime, "Invalid time range");
        require(_startTime > block.timestamp, "Start time must be in future");

        uint256 electionId = electionCount++;
        
        elections[electionId] = Election({
            title: _title,
            description: _description,
            startTime: _startTime,
            endTime: _endTime,
            isActive: true,
            totalVotes: 0,
            creator: msg.sender
        });

        emit ElectionCreated(electionId, _title, _startTime, _endTime);
        return electionId;
    }

    function addCandidate(
        uint256 _electionId,
        string memory _name,
        string memory _description,
        string memory _partyAffiliation
    ) external onlyRole(ELECTION_OFFICER_ROLE) returns (uint256) {
        require(_electionId < electionCount, "Election does not exist");
        require(elections[_electionId].isActive, "Election is not active");
        require(block.timestamp < elections[_electionId].startTime, "Election has started");

        uint256 candidateId = candidateCount[_electionId]++;
        
        candidates[_electionId][candidateId] = Candidate({
            name: _name,
            description: _description,
            partyAffiliation: _partyAffiliation,
            voteCount: 0,
            isActive: true
        });

        emit CandidateAdded(_electionId, candidateId, _name);
        return candidateId;
    }

    function castVote(
        uint256 _electionId,
        uint256 _candidateId,
        bytes32 _voterHash
    ) external nonReentrant whenNotPaused {
        require(_electionId < electionCount, "Election does not exist");
        require(_candidateId < candidateCount[_electionId], "Candidate does not exist");
        
        Election storage election = elections[_electionId];
        require(election.isActive, "Election is not active");
        require(block.timestamp >= election.startTime, "Election has not started");
        require(block.timestamp <= election.endTime, "Election has ended");
        require(!hasVoted[_electionId][_voterHash], "Already voted");

        Candidate storage candidate = candidates[_electionId][_candidateId];
        require(candidate.isActive, "Candidate is not active");

        hasVoted[_electionId][_voterHash] = true;
        candidate.voteCount++;
        election.totalVotes++;

        electionVotes[_electionId].push(Vote({
            electionId: _electionId,
            candidateId: _candidateId,
            voterHash: _voterHash,
            timestamp: block.timestamp
        }));

        emit VoteCast(_electionId, _candidateId, _voterHash, block.timestamp);
    }

    function endElection(uint256 _electionId) external onlyRole(ELECTION_OFFICER_ROLE) {
        require(_electionId < electionCount, "Election does not exist");
        Election storage election = elections[_electionId];
        require(election.isActive, "Election already ended");
        require(block.timestamp >= election.endTime, "Election period not over");

        election.isActive = false;
        emit ElectionEnded(_electionId, block.timestamp);
    }

    function getElectionResults(uint256 _electionId) 
        external 
        view 
        returns (
            string memory title,
            uint256 totalVotes,
            uint256[] memory candidateIds,
            string[] memory candidateNames,
            uint256[] memory voteCounts
        ) 
    {
        require(_electionId < electionCount, "Election does not exist");
        
        Election memory election = elections[_electionId];
        uint256 count = candidateCount[_electionId];
        
        candidateIds = new uint256[](count);
        candidateNames = new string[](count);
        voteCounts = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            candidateIds[i] = i;
            candidateNames[i] = candidates[_electionId][i].name;
            voteCounts[i] = candidates[_electionId][i].voteCount;
        }
        
        return (election.title, election.totalVotes, candidateIds, candidateNames, voteCounts);
    }

    function hasVoterVoted(uint256 _electionId, bytes32 _voterHash) external view returns (bool) {
        return hasVoted[_electionId][_voterHash];
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
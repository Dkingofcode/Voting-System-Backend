const blockchainConfig = require('../config/blockchain');
const logger = require('../utils/logger');
const { ethers } = require('ethers');

class BlockchainService {
  async initialize() {
    return await blockchainConfig.initialize();
  }

  async createElection(electionData) {
    try {
      const contract = blockchainConfig.getContract();
      
      const tx = await contract.createElection(
        electionData.title,
        electionData.description,
        Math.floor(new Date(electionData.startDate).getTime() / 1000),
        Math.floor(new Date(electionData.endDate).getTime() / 1000)
      );

      logger.info(`Election creation transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      
      // Extract election ID from event
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'ElectionCreated';
        } catch (e) {
          return false;
        }
      });

      const electionId = event ? contract.interface.parseLog(event).args.electionId : null;
      
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        electionId: Number(electionId)
      };
    } catch (error) {
      logger.error('Error creating election on blockchain:', error);
      throw error;
    }
  }

  async addCandidate(electionId, candidateData) {
    try {
      const contract = blockchainConfig.getContract();
      
      const tx = await contract.addCandidate(
        electionId,
        candidateData.name,
        candidateData.biography || '',
        candidateData.partyAffiliation || ''
      );

      logger.info(`Candidate addition transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'CandidateAdded';
        } catch (e) {
          return false;
        }
      });

      const candidateId = event ? contract.interface.parseLog(event).args.candidateId : null;
      
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        candidateId: Number(candidateId)
      };
    } catch (error) {
      logger.error('Error adding candidate to blockchain:', error);
      throw error;
    }
  }

  async castVote(electionId, candidateId, voterHash) {
    try {
      const contract = blockchainConfig.getContract();
      
      // Check if already voted
      const hasVoted = await contract.hasVoterVoted(electionId, voterHash);
      if (hasVoted) {
        throw new Error('Voter has already cast a vote in this election');
      }

      const tx = await contract.castVote(electionId, candidateId, voterHash);
      
      logger.info(`Vote transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      logger.error('Error casting vote on blockchain:', error);
      throw error;
    }
  }

  async getElectionResults(electionId) {
    try {
      const contract = blockchainConfig.getContract();
      const results = await contract.getElectionResults(electionId);
      
      return {
        title: results.title,
        totalVotes: Number(results.totalVotes),
        candidates: results.candidateIds.map((id, index) => ({
          candidateId: Number(id),
          name: results.candidateNames[index],
          voteCount: Number(results.voteCounts[index])
        }))
      };
    } catch (error) {
      logger.error('Error fetching election results:', error);
      throw error;
    }
  }

  async endElection(electionId) {
    try {
      const contract = blockchainConfig.getContract();
      const tx = await contract.endElection(electionId);
      
      logger.info(`End election transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      logger.error('Error ending election on blockchain:', error);
      throw error;
    }
  }

  async hasVoted(electionId, voterHash) {
    try {
      const contract = blockchainConfig.getContract();
      return await contract.hasVoterVoted(electionId, voterHash);
    } catch (error) {
      logger.error('Error checking vote status:', error);
      throw error;
    }
  }

  generateVoterHash(voterId, electionId) {
    return ethers.keccak256(
      ethers.toUtf8Bytes(`${voterId}-${electionId}-${process.env.VOTER_SALT}`)
    );
  }
}

module.exports = new BlockchainService();
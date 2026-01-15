const Vote = require('../models/Vote.model');
const Voter = require('../models/Voter.model');
const Election = require('../models/Election.model');
const Candidate = require('../models/Candidate.model');
const blockchainService = require('../services/blockchain.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { ethers } = require('ethers');

exports.castVote = async (req, res, next) => {
  try {
    const { electionId, candidateId } = req.body;
    const userId = req.user._id;

    // Get voter profile
    const voter = await Voter.findOne({ user: userId });

    if (!voter) {
      throw new ApiError('Voter profile not found', 404);
    }

    if (!voter.isEligibleToVote()) {
      throw new ApiError('You are not eligible to vote', 403);
    }

    // Get election
    const election = await Election.findById(electionId);

    if (!election) {
      throw new ApiError('Election not found', 404);
    }

    if (!election.isActive()) {
      throw new ApiError('Election is not currently active', 400);
    }

    // Check if already voted
    const existingVote = await Vote.findOne({ 
      election: electionId, 
      voter: voter._id 
    });

    if (existingVote) {
      throw new ApiError('You have already voted in this election', 400);
    }

    // Verify candidate
    const candidate = await Candidate.findOne({
      _id: candidateId,
      election: electionId,
      isActive: true
    });

    if (!candidate) {
      throw new ApiError('Invalid candidate', 404);
    }

    // Generate voter hash (anonymized)
    const voterHash = blockchainService.generateVoterHash(
      voter._id.toString(),
      electionId
    );

    // Check blockchain for duplicate vote
    const hasVotedOnChain = await blockchainService.hasVoted(
      election.blockchainElectionId,
      voterHash
    );

    if (hasVotedOnChain) {
      throw new ApiError('Vote already recorded on blockchain', 400);
    }

    // Cast vote on blockchain
    const blockchainResult = await blockchainService.castVote(
      election.blockchainElectionId,
      candidate.blockchainCandidateId,
      voterHash
    );

    // Create encrypted candidate hash (for audit without revealing vote)
    const candidateHash = ethers.keccak256(
      ethers.toUtf8Bytes(`${candidateId}-${Date.now()}`)
    );

    // Record vote in database
    const vote = await Vote.create({
      election: electionId,
      voter: voter._id,
      voterHash,
      candidateHash,
      transactionHash: blockchainResult.transactionHash,
      blockNumber: blockchainResult.blockNumber,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      isVerified: true
    });

    // Update election vote count
    election.totalVotes += 1;
    await election.save();

    // Update candidate vote count
    candidate.voteCount += 1;
    await candidate.save();

    // Update voter history
    voter.votingHistory.push({
      election: electionId,
      votedAt: new Date(),
      transactionHash: blockchainResult.transactionHash
    });
    await voter.save();

    logger.info(`Vote cast successfully: Election ${electionId}, Transaction ${blockchainResult.transactionHash}`);

    res.status(201).json({
      status: 'success',
      message: 'Vote cast successfully',
      data: {
        transactionHash: blockchainResult.transactionHash,
        blockNumber: blockchainResult.blockNumber,
        timestamp: vote.timestamp
      }
    });
  } catch (error) {
    logger.error('Error casting vote:', error);
    next(error);
  }
};

exports.verifyVote = async (req, res, next) => {
  try {
    const { transactionHash } = req.params;

    const vote = await Vote.findOne({ transactionHash })
      .populate('election', 'title status')
      .select('-voter -candidateHash');

    if (!vote) {
      throw new ApiError('Vote not found', 404);
    }

    res.json({
      status: 'success',
      data: {
        vote,
        verified: vote.isVerified,
        message: 'This vote has been recorded on the blockchain and cannot be altered'
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyVotes = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const voter = await Voter.findOne({ user: userId });

    if (!voter) {
      throw new ApiError('Voter profile not found', 404);
    }

    const votes = await Vote.find({ voter: voter._id })
      .populate('election', 'title type status startDate endDate')
      .select('-candidateHash -voterHash')
      .sort('-timestamp');

    res.json({
      status: 'success',
      data: {
        votes: votes.map(vote => ({
          election: vote.election,
          transactionHash: vote.transactionHash,
          timestamp: vote.timestamp,
          isVerified: vote.isVerified
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.checkVotingStatus = async (req, res, next) => {
  try {
    const { electionId } = req.params;
    const userId = req.user._id;

    const voter = await Voter.findOne({ user: userId });

    if (!voter) {
      throw new ApiError('Voter profile not found', 404);
    }

    const election = await Election.findById(electionId);

    if (!election) {
      throw new ApiError('Election not found', 404);
    }

    const hasVoted = await Vote.exists({ 
      election: electionId, 
      voter: voter._id 
    });

    res.json({
      status: 'success',
      data: {
        hasVoted: !!hasVoted,
        isEligible: voter.isEligibleToVote(),
        electionActive: election.isActive()
      }
    });
  } catch (error) {
    next(error);
  }
};
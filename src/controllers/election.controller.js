const Election = require('../models/Election.model');
const Candidate = require('../models/Candidate.model');
const Vote = require('../models/Vote.model');
const blockchainService = require('../services/blockchain.service');
const ApiError = require('../utils/ApiError');
const cacheService = require('../services/cache.service');

exports.createElection = async (req, res, next) => {
  try {
    const { title, description, type, startDate, endDate, eligibilityCriteria, settings } = req.body;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) {
      throw new ApiError('Start date must be in the future', 400);
    }

    if (end <= start) {
      throw new ApiError('End date must be after start date', 400);
    }

    // Create election on blockchain
    const blockchainResult = await blockchainService.createElection({
      title,
      description,
      startDate: start,
      endDate: end
    });

    // Create election in database
    const election = await Election.create({
      title,
      description,
      type,
      startDate: start,
      endDate: end,
      blockchainElectionId: blockchainResult.electionId,
      eligibilityCriteria,
      settings,
      createdBy: req.user._id,
      status: 'draft'
    });

    res.status(201).json({
      status: 'success',
      data: {
        election,
        blockchainData: blockchainResult
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllElections = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;

    const query = { isPublished: true };
    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (page - 1) * limit;
    const elections = await Election.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'email');

    const total = await Election.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        elections,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalElections: total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getElectionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const election = await Election.findById(id)
      .populate('createdBy', 'email');

    if (!election) {
      throw new ApiError('Election not found', 404);
    }

    // Get candidates
    const candidates = await Candidate.find({ 
      election: id, 
      isActive: true 
    }).select('-__v');

    res.json({
      status: 'success',
      data: {
        election,
        candidates
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateElection = async (req, res, next) => {
  try {
    const { id } = req.params;

    const election = await Election.findById(id);

    if (!election) {
      throw new ApiError('Election not found', 404);
    }

    if (election.status !== 'draft') {
      throw new ApiError('Cannot update election that has been published', 400);
    }

    if (election.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new ApiError('Not authorized to update this election', 403);
    }

    Object.assign(election, req.body);
    await election.save();

    res.json({
      status: 'success',
      data: election
    });
  } catch (error) {
    next(error);
  }
};

exports.publishElection = async (req, res, next) => {
  try {
    const { id } = req.params;

    const election = await Election.findById(id);

    if (!election) {
      throw new ApiError('Election not found', 404);
    }

    // Check if election has candidates
    const candidateCount = await Candidate.countDocuments({ 
      election: id, 
      isActive: true 
    });

    if (candidateCount < 2) {
      throw new ApiError('Election must have at least 2 candidates', 400);
    }

    election.isPublished = true;
    election.status = 'scheduled';
    await election.save();

    res.json({
      status: 'success',
      data: election
    });
  } catch (error) {
    next(error);
  }
};

exports.getElectionResults = async (req, res, next) => {
  try {
    const { id } = req.params;

    const election = await Election.findById(id);

    if (!election) {
      throw new ApiError('Election not found', 404);
    }

    // Check cache first
    const cacheKey = `election:results:${id}`;
    const cachedResults = await cacheService.get(cacheKey);

    if (cachedResults) {
      return res.json({
        status: 'success',
        cached: true,
        data: cachedResults
      });
    }

    // Get results from blockchain
    const blockchainResults = await blockchainService.getElectionResults(
      election.blockchainElectionId
    );

    // Get candidate details from database
    const candidates = await Candidate.find({ 
      election: id 
    }).select('name partyAffiliation photo blockchainCandidateId');

    const results = {
      election: {
        id: election._id,
        title: election.title,
        status: election.status,
        totalVotes: blockchainResults.totalVotes,
        voterTurnout: election.voterTurnout
      },
      candidates: blockchainResults.candidates.map(bcCandidate => {
        const dbCandidate = candidates.find(
          c => c.blockchainCandidateId === bcCandidate.candidateId
        );
        return {
          ...bcCandidate,
          details: dbCandidate
        };
      }).sort((a, b) => b.voteCount - a.voteCount)
    };

    // Cache results for 1 minute if election is active, 1 hour if ended
    const cacheTime = election.status === 'ended' ? 3600 : 60;
    await cacheService.set(cacheKey, results, cacheTime);

    res.json({
      status: 'success',
      data: results
    });
  } catch (error) {
    next(error);
  }
};

exports.endElection = async (req, res, next) => {
  try {
    const { id } = req.params;

    const election = await Election.findById(id);

    if (!election) {
      throw new ApiError('Election not found', 404);
    }

    if (election.status === 'ended') {
      throw new ApiError('Election has already ended', 400);
    }

    if (new Date() < election.endDate) {
      throw new ApiError('Election period has not ended yet', 400);
    }

    // End election on blockchain
    await blockchainService.endElection(election.blockchainElectionId);

    election.status = 'ended';
    await election.save();

    // Clear cache
    await cacheService.delete(`election:results:${id}`);

    res.json({
      status: 'success',
      message: 'Election ended successfully',
      data: election
    });
  } catch (error) {
    next(error);
  }
};
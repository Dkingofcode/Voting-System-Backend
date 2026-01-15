const express = require('express');
const { body } = require('express-validator');
const voteController = require('../controllers/vote.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validator');
const { votingLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  votingLimiter,
  [
    body('electionId').isMongoId().withMessage('Valid election ID required'),
    body('candidateId').isMongoId().withMessage('Valid candidate ID required')
  ],
  validate,
  voteController.castVote
);

router.get('/my-votes', voteController.getMyVotes);
router.get('/verify/:transactionHash', voteController.verifyVote);
router.get('/status/:electionId', voteController.checkVotingStatus);

module.exports = router;
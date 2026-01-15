const express = require('express');
const { body } = require('express-validator');
const electionController = require('../controllers/election.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.get('/', electionController.getAllElections);
router.get('/:id', electionController.getElectionById);
router.get('/:id/results', electionController.getElectionResults);

router.use(protect);

router.post(
  '/',
  restrictTo('election_officer', 'admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('type').isIn(['presidential', 'parliamentary', 'local', 'referendum', 'other']),
    body('startDate').isISO8601().withMessage('Valid start date required'),
    body('endDate').isISO8601().withMessage('Valid end date required')
  ],
  validate,
  electionController.createElection
);

router.put('/:id', restrictTo('election_officer', 'admin'), electionController.updateElection);
router.post('/:id/publish', restrictTo('election_officer', 'admin'), electionController.publishElection);
router.post('/:id/end', restrictTo('election_officer', 'admin'), electionController.endElection);

module.exports = router;

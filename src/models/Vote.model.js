const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  election: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  voter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voter',
    required: true
  },
  voterHash: {
    type: String,
    required: true
  },
  candidateHash: {
    type: String,
    required: true
  },
  transactionHash: {
    type: String,
    required: true,
    unique: true
  },
  blockNumber: Number,
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: String,
  userAgent: String,
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
voteSchema.index({ election: 1, voter: 1 }, { unique: true });
voteSchema.index({ transactionHash: 1 });
voteSchema.index({ election: 1, timestamp: -1 });

module.exports = mongoose.model('Vote', voteSchema);
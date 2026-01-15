const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  election: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Candidate name is required'],
    trim: true
  },
  biography: {
    type: String,
    maxlength: 2000
  },
  partyAffiliation: {
    type: String,
    trim: true
  },
  photo: {
    type: String,
    default: 'default-candidate.jpg'
  },
  manifestoUrl: String,
  socialMedia: {
    twitter: String,
    facebook: String,
    website: String
  },
  blockchainCandidateId: {
    type: Number,
    required: true
  },
  voteCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  registrationNumber: {
    type: String,
    unique: true,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
candidateSchema.index({ election: 1, blockchainCandidateId: 1 });
candidateSchema.index({ election: 1, isActive: 1 });

module.exports = mongoose.model('Candidate', candidateSchema);
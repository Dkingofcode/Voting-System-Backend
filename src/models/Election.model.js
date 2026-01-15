const mongoose = require('mongoose');

const electionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Election title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Election description is required']
  },
  type: {
    type: String,
    enum: ['presidential', 'parliamentary', 'local', 'referendum', 'other'],
    required: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'ended', 'cancelled'],
    default: 'draft'
  },
  blockchainElectionId: {
    type: Number,
    unique: true,
    sparse: true
  },
  eligibilityCriteria: {
    minAge: {
      type: Number,
      default: 18
    },
    requireVerification: {
      type: Boolean,
      default: true
    },
    allowedRegions: [String]
  },
  settings: {
    allowAbstain: {
      type: Boolean,
      default: false
    },
    showResults: {
      type: String,
      enum: ['immediate', 'after_voting', 'manual'],
      default: 'after_voting'
    },
    multipleChoice: {
      type: Boolean,
      default: false
    }
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  totalEligibleVoters: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
electionSchema.index({ status: 1, startDate: 1 });
electionSchema.index({ blockchainElectionId: 1 });

// Virtual for voter turnout
electionSchema.virtual('voterTurnout').get(function() {
  if (this.totalEligibleVoters === 0) return 0;
  return (this.totalVotes / this.totalEligibleVoters * 100).toFixed(2);
});

// Check if election is active
electionSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && 
         now >= this.startDate && 
         now <= this.endDate;
};

// Validate dates
electionSchema.pre('save', function(next) {
  if (this.startDate >= this.endDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

module.exports = mongoose.model('Election', electionSchema);
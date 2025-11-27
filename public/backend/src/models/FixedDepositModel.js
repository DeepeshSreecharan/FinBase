const mongoose = require('mongoose');

const fixedDepositSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  fdNumber: {
    type: String,
    unique: true
  },
  amount: {
    type: Number,
    required: true,
    min: [1000, 'Minimum FD amount is ₹1000']
  },
  tenure: {
    type: Number,
    required: true,
    min: [6, 'Minimum tenure is 6 months'],
    max: [120, 'Maximum tenure is 120 months']
  },
  interestRate: {
    type: Number,
    required: true,
    min: [0, 'Interest rate cannot be negative']
  },
  maturityAmount: {
    type: Number,
    required: true
  },
  actualMaturityAmount: {
    type: Number // In case of premature withdrawal
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  maturityDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'matured', 'broken', 'closed'],
    default: 'active'
  },
  autoRenewal: {
    type: Boolean,
    default: false
  },
  nomineeDetails: {
    name: String,
    relationship: String,
    phone: String
  },
  penaltyRate: {
    type: Number,
    default: 1 // 1% penalty for premature withdrawal
  }
}, {
  timestamps: true
});

// Generate FD number before saving
fixedDepositSchema.pre('save', function(next) {
  if (!this.fdNumber) {
    this.fdNumber = 'FD' + Date.now() + Math.floor(Math.random() * 1000);
  }
  next();
});

// Calculate current value virtual
fixedDepositSchema.virtual('currentValue').get(function() {
  if (this.status !== 'active') return this.actualMaturityAmount || this.amount;
  
  const daysPassed = Math.floor((new Date() - this.startDate) / (1000 * 60 * 60 * 24));
  const totalDays = this.tenure * 30;
  const progress = Math.min(daysPassed / totalDays, 1);
  
  return this.amount + (this.maturityAmount - this.amount) * progress;
});

// Indexes for better query performance


module.exports = mongoose.model('FixedDeposit', fixedDepositSchema);
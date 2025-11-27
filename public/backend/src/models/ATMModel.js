const mongoose = require('mongoose');

const atmCardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cardNumber: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{16}$/, 'Card number must be 16 digits']
  },
  expiryDate: {
    type: Date,
    required: true
  },
  cvv: {
    type: String,
    required: true,
    match: [/^\d{3}$/, 'CVV must be 3 digits']
  },
  pin: {
    type: String // Hashed PIN
  },
  pinSet: {
    type: Boolean,
    default: false
  },
  cardType: {
    type: String,
    enum: ['debit', 'credit'],
    default: 'debit'
  },
  status: {
    type: String,
    enum: ['requested', 'approved', 'shipped', 'delivered', 'active', 'blocked', 'expired', 'cancelled'],
    default: 'requested'
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  dailyWithdrawalLimit: {
    type: Number,
    default: 25000
  },
  dailySpendingLimit: {
    type: Number,
    default: 50000
  },
  atmWithdrawalCount: {
    type: Number,
    default: 0
  },
  lastUsedDate: {
    type: Date
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  activationDate: {
    type: Date
  },
  blockReason: {
    type: String
  },
  internationalUsage: {
    type: Boolean,
    default: false
  },
  onlineUsage: {
    type: Boolean,
    default: true
  },
  contactlessEnabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});



// Virtual to check if card is expired
atmCardSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

// Virtual to get masked card number
atmCardSchema.virtual('maskedCardNumber').get(function() {
  return `****-****-****-${this.cardNumber.slice(-4)}`;
});

module.exports = mongoose.model('ATMCard', atmCardSchema);
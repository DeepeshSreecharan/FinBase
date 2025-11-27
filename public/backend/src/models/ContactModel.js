const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  category: {
    type: String,
    enum: ['general', 'account', 'card', 'loan', 'complaint', 'suggestion', 'technical'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Optional, for logged-in users
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin user who handles this inquiry
  },
  responseMessage: {
    type: String
  },
  responseDate: {
    type: Date
  },
  ticketNumber: {
    type: String,
    unique: true
  },
  attachments: [{
    filename: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String]
}, {
  timestamps: true
});

// Generate ticket number before saving
contactSchema.pre('save', function(next) {
  if (!this.ticketNumber) {
    this.ticketNumber = 'TKT' + Date.now() + Math.floor(Math.random() * 1000);
  }
  next();
});

// Indexes for better query performance


module.exports = mongoose.model('Contact', contactSchema);
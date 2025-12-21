const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const candidateSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: String,

  // Authentication
  accessCode: String, // For accessing specific assessments

  // Profile
  profile: {
    yearsOfExperience: Number,
    currentRole: String,
    skills: [String],
    resume: String, // URL or path
    linkedIn: String,
    github: String,
    portfolio: String
  },

  // Assessments
  assessments: [{
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment'
    },
    status: String,
    invitedAt: Date,
    expiresAt: Date
  }],

  // Privacy
  consentGiven: {
    videoRecording: { type: Boolean, default: false },
    dataProcessing: { type: Boolean, default: false },
    consentDate: Date
  }
}, {
  timestamps: true
});

// Hash access code before saving
candidateSchema.pre('save', async function(next) {
  if (this.isModified('accessCode') && this.accessCode) {
    this.accessCode = await bcrypt.hash(this.accessCode, 10);
  }
  next();
});

// Method to compare access codes
candidateSchema.methods.compareAccessCode = async function(code) {
  return await bcrypt.compare(code, this.accessCode);
};

module.exports = mongoose.model('Candidate', candidateSchema);

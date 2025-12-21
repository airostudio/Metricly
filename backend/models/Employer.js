const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  company: {
    name: { type: String, required: true },
    website: String,
    industry: String,
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
    },
    logo: String
  },

  contactPerson: {
    firstName: String,
    lastName: String,
    position: String,
    phone: String
  },

  // Subscription
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'professional', 'enterprise'],
      default: 'free'
    },
    testsLimit: { type: Number, default: 3 },
    candidatesLimit: { type: Number, default: 10 },
    validUntil: Date,
    features: {
      videoProctoring: { type: Boolean, default: false },
      advancedAnalytics: { type: Boolean, default: false },
      customBranding: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false }
    }
  },

  // Stats
  stats: {
    totalTests: { type: Number, default: 0 },
    totalCandidates: { type: Number, default: 0 },
    totalAssessments: { type: Number, default: 0 }
  },

  role: {
    type: String,
    default: 'employer'
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  lastLogin: Date
}, {
  timestamps: true
});

// Hash password before saving
employerSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare passwords
employerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
employerSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Employer', employerSchema);

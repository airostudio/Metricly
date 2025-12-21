const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,

  // Test Configuration
  config: {
    totalQuestions: { type: Number, default: 10 },
    questionTimeLimit: { type: Number, default: 900 }, // seconds
    totalTimeLimit: { type: Number, default: 7200 }, // seconds
    enableAIDetection: { type: Boolean, default: true },
    enableVideoProctoring: { type: Boolean, default: false },
    strictMode: { type: Boolean, default: true },
    randomizeQuestions: { type: Boolean, default: false },
    showResults: { type: Boolean, default: false },
    passingScore: { type: Number, default: 70 }
  },

  // Questions
  questions: [{
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      required: true
    },
    category: {
      type: String,
      enum: ['algorithms', 'data-structures', 'debugging', 'system-design', 'database', 'web-development', 'other']
    },
    language: {
      type: String,
      enum: ['javascript', 'python', 'java', 'cpp', 'sql', 'html', 'css', 'typescript'],
      required: true
    },
    template: { type: String, required: true },
    solution: String, // Reference solution

    // Test Cases
    tests: [{
      input: mongoose.Schema.Types.Mixed,
      expected: mongoose.Schema.Types.Mixed,
      hidden: { type: Boolean, default: false } // Hidden test cases
    }],

    // Scoring
    points: { type: Number, default: 10 },

    // Time estimates
    estimatedTime: Number, // in seconds

    // Hints (optional)
    hints: [String]
  }],

  // Target Roles
  targetRoles: [{
    type: String,
    enum: ['frontend-developer', 'backend-developer', 'fullstack-developer', 'devops', 'data-scientist', 'qa-engineer', 'support-engineer', 'other']
  }],

  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },

  // Usage Statistics
  stats: {
    totalAttempts: { type: Number, default: 0 },
    totalCompletions: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    averageTime: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes
testSchema.index({ employerId: 1, status: 1 });
testSchema.index({ targetRoles: 1 });

// Methods
testSchema.methods.selectQuestions = function(count, adaptiveDifficulty = null) {
  let questions = this.questions;

  if (adaptiveDifficulty) {
    // Filter by difficulty
    questions = questions.filter(q => q.difficulty === adaptiveDifficulty);
  }

  if (this.config.randomizeQuestions) {
    // Shuffle questions
    questions = questions.sort(() => Math.random() - 0.5);
  }

  return questions.slice(0, count || this.config.totalQuestions);
};

module.exports = mongoose.model('Test', testSchema);

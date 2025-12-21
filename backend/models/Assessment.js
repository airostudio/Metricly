const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    required: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'terminated'],
    default: 'not_started'
  },
  startedAt: Date,
  completedAt: Date,
  totalTimeSpent: Number, // in seconds

  // Security Monitoring
  security: {
    tabSwitchCount: { type: Number, default: 0 },
    copyAttempts: { type: Number, default: 0 },
    pasteAttempts: { type: Number, default: 0 },
    suspiciousActivityCount: { type: Number, default: 0 },
    aiDetectionFlags: { type: Number, default: 0 },
    violations: [{
      type: {
        type: String,
        enum: ['tab_switch', 'copy_attempt', 'paste_attempt', 'ai_detection', 'devtools', 'face_not_detected', 'multiple_faces', 'other']
      },
      timestamp: Date,
      details: String
    }]
  },

  // Answers
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    code: String,
    skipped: { type: Boolean, default: false },
    passed: Boolean,
    testResults: [{
      testNumber: Number,
      passed: Boolean,
      input: mongoose.Schema.Types.Mixed,
      expected: mongoose.Schema.Types.Mixed,
      actual: mongoose.Schema.Types.Mixed,
      error: String
    }],
    timeSpent: Number, // in seconds
    timeToFirstKey: Number, // in seconds
    submittedAt: Date,
    autoSubmitted: { type: Boolean, default: false },

    // AI Detection Data
    aiAnalysis: {
      typingPattern: {
        avgInterval: Number,
        variance: Number,
        suspiciousScore: Number
      },
      codePatterns: {
        commentRatio: Number,
        complexityScore: Number,
        aiPatternsDetected: [String]
      },
      overallSuspicionScore: Number // 0-100
    }
  }],

  // Performance Metrics
  performance: {
    questionsCompleted: { type: Number, default: 0 },
    questionsSkipped: { type: Number, default: 0 },
    questionsPassedAllTests: { type: Number, default: 0 },
    overallScore: Number, // 0-100
    difficultyProgression: [String]
  },

  // Proctoring Data
  proctoring: {
    enabled: { type: Boolean, default: false },
    videoRecordingPath: String,
    snapshots: [{
      timestamp: Date,
      imagePath: String,
      facesDetected: Number,
      flags: [String]
    }]
  },

  // Final Report
  report: {
    generated: { type: Boolean, default: false },
    generatedAt: Date,
    summary: String,
    strengths: [String],
    weaknesses: [String],
    recommendation: String,
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
assessmentSchema.index({ candidateId: 1, testId: 1 });
assessmentSchema.index({ employerId: 1, status: 1 });
assessmentSchema.index({ createdAt: -1 });

// Methods
assessmentSchema.methods.calculateScore = function() {
  if (this.answers.length === 0) return 0;

  const passedQuestions = this.answers.filter(a => a.passed && !a.skipped).length;
  const totalQuestions = this.answers.length;
  const score = (passedQuestions / totalQuestions) * 100;

  // Deduct points for security violations
  const violationPenalty = Math.min(this.security.suspiciousActivityCount * 2, 20);

  return Math.max(0, Math.round(score - violationPenalty));
};

assessmentSchema.methods.terminate = async function(reason) {
  this.status = 'terminated';
  this.completedAt = new Date();
  this.report.summary = `Assessment terminated: ${reason}`;
  await this.save();
};

module.exports = mongoose.model('Assessment', assessmentSchema);

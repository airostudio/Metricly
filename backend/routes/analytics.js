const express = require('express');
const Assessment = require('../models/Assessment');
const Test = require('../models/Test');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics for employer
// @access  Private (Employer)
router.get('/dashboard', protect, authorize('employer'), async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const startDate = new Date();
    const days = parseInt(timeRange.replace('d', ''));
    startDate.setDate(startDate.getDate() - days);

    // Get all assessments for this employer
    const assessments = await Assessment.find({
      employerId: req.employer._id,
      createdAt: { $gte: startDate }
    });

    // Calculate metrics
    const totalAssessments = assessments.length;
    const completed = assessments.filter(a => a.status === 'completed').length;
    const inProgress = assessments.filter(a => a.status === 'in_progress').length;
    const terminated = assessments.filter(a => a.status === 'terminated').length;

    const completionRate = totalAssessments > 0
      ? Math.round((completed / totalAssessments) * 100)
      : 0;

    // Average score
    const completedAssessments = assessments.filter(a => a.status === 'completed');
    const avgScore = completedAssessments.length > 0
      ? Math.round(
          completedAssessments.reduce((sum, a) => sum + (a.performance.overallScore || 0), 0) /
          completedAssessments.length
        )
      : 0;

    // Security violations
    const totalViolations = assessments.reduce(
      (sum, a) => sum + a.security.violations.length,
      0
    );

    const avgViolations = totalAssessments > 0
      ? Math.round(totalViolations / totalAssessments)
      : 0;

    // Time metrics
    const avgTimeSpent = completedAssessments.length > 0
      ? Math.round(
          completedAssessments.reduce((sum, a) => sum + (a.totalTimeSpent || 0), 0) /
          completedAssessments.length
        )
      : 0;

    // Difficulty distribution
    const difficultyStats = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      expert: 0
    };

    completedAssessments.forEach(assessment => {
      if (assessment.report.skillLevel) {
        difficultyStats[assessment.report.skillLevel]++;
      }
    });

    // Recent activity
    const recentAssessments = await Assessment.find({
      employerId: req.employer._id
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('candidateId', 'firstName lastName email')
      .populate('testId', 'title');

    res.json({
      success: true,
      analytics: {
        overview: {
          totalAssessments,
          completed,
          inProgress,
          terminated,
          completionRate,
          avgScore,
          avgTimeSpent: Math.round(avgTimeSpent / 60), // Convert to minutes
          totalViolations,
          avgViolations
        },
        difficultyDistribution: difficultyStats,
        recentActivity: recentAssessments.map(a => ({
          id: a._id,
          candidate: a.candidateId,
          test: a.testId,
          status: a.status,
          score: a.performance.overallScore,
          createdAt: a.createdAt
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/analytics/test/:testId
// @desc    Get analytics for specific test
// @access  Private (Employer)
router.get('/test/:testId', protect, authorize('employer'), async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);

    if (!test || test.employerId.toString() !== req.employer._id.toString()) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const assessments = await Assessment.find({
      testId: req.params.testId,
      status: 'completed'
    });

    // Question-level analytics
    const questionAnalytics = test.questions.map((question, index) => {
      const questionId = question._id.toString();
      const attempts = assessments.filter(
        a => a.answers.some(ans => ans.questionId.toString() === questionId)
      ).length;

      const passed = assessments.filter(
        a => a.answers.some(ans =>
          ans.questionId.toString() === questionId && ans.passed
        )
      ).length;

      const skipped = assessments.filter(
        a => a.answers.some(ans =>
          ans.questionId.toString() === questionId && ans.skipped
        )
      ).length;

      const avgTime = assessments.reduce((sum, a) => {
        const answer = a.answers.find(ans =>
          ans.questionId.toString() === questionId
        );
        return sum + (answer?.timeSpent || 0);
      }, 0) / (attempts || 1);

      return {
        questionNumber: index + 1,
        title: question.title,
        difficulty: question.difficulty,
        attempts,
        passed,
        skipped,
        successRate: attempts > 0 ? Math.round((passed / attempts) * 100) : 0,
        avgTimeSpent: Math.round(avgTime)
      };
    });

    res.json({
      success: true,
      test: {
        id: test._id,
        title: test.title,
        totalAttempts: test.stats.totalAttempts,
        totalCompletions: test.stats.totalCompletions,
        avgScore: test.stats.averageScore
      },
      questionAnalytics
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/analytics/assessment/:assessmentId
// @desc    Get detailed analytics for a single assessment
// @access  Private (Employer)
router.get('/assessment/:assessmentId', protect, authorize('employer'), async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.assessmentId)
      .populate('candidateId', 'firstName lastName email profile')
      .populate('testId', 'title description questions');

    if (!assessment || assessment.employerId.toString() !== req.employer._id.toString()) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Detailed answer analysis
    const answerAnalysis = assessment.answers.map(answer => {
      const question = assessment.testId.questions.id(answer.questionId);

      return {
        questionTitle: question.title,
        difficulty: question.difficulty,
        passed: answer.passed,
        skipped: answer.skipped,
        timeSpent: answer.timeSpent,
        timeToFirstKey: answer.timeToFirstKey,
        testsPassed: answer.testResults.filter(t => t.passed).length,
        totalTests: answer.testResults.length,
        aiSuspicionScore: answer.aiAnalysis?.overallSuspicionScore || 0,
        code: answer.code
      };
    });

    res.json({
      success: true,
      assessment: {
        id: assessment._id,
        candidate: assessment.candidateId,
        test: {
          id: assessment.testId._id,
          title: assessment.testId.title
        },
        status: assessment.status,
        score: assessment.performance.overallScore,
        startedAt: assessment.startedAt,
        completedAt: assessment.completedAt,
        totalTimeSpent: assessment.totalTimeSpent,
        security: {
          violations: assessment.security.violations.length,
          tabSwitches: assessment.security.tabSwitchCount,
          suspiciousActivity: assessment.security.suspiciousActivityCount,
          aiFlags: assessment.security.aiDetectionFlags
        },
        performance: assessment.performance,
        answers: answerAnalysis
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

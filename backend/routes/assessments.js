const express = require('express');
const Assessment = require('../models/Assessment');
const Test = require('../models/Test');
const Candidate = require('../models/Candidate');
const { protect, authorize, verifyCandidateAccess } = require('../middleware/auth');
const AIDetector = require('../utils/aiDetector');

const router = express.Router();

// @route   POST /api/assessments/:id/start
// @desc    Start an assessment
// @access  Private (Candidate)
router.post('/:id/start', protect, authorize('candidate'), verifyCandidateAccess, async (req, res) => {
  try {
    const assessment = req.assessment;

    if (assessment.status !== 'not_started') {
      return res.status(400).json({ error: 'Assessment already started or completed' });
    }

    // Check consent
    if (!req.body.videoConsent || !req.body.dataConsent) {
      return res.status(400).json({ error: 'Consent required to start assessment' });
    }

    assessment.status = 'in_progress';
    assessment.startedAt = new Date();
    await assessment.save();

    // Get test questions
    const test = await Test.findById(assessment.testId);
    const questions = test.selectQuestions(test.config.totalQuestions);

    res.json({
      success: true,
      assessment: {
        id: assessment._id,
        status: assessment.status,
        startedAt: assessment.startedAt,
        config: test.config
      },
      questions: questions.map(q => ({
        id: q._id,
        title: q.title,
        description: q.description,
        difficulty: q.difficulty,
        language: q.language,
        template: q.template,
        tests: q.tests.filter(t => !t.hidden).map(t => ({
          input: t.input,
          expected: t.expected
        }))
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/assessments/:id/submit-answer
// @desc    Submit answer for a question
// @access  Private (Candidate)
router.post('/:id/submit-answer', protect, authorize('candidate'), verifyCandidateAccess, async (req, res) => {
  try {
    const assessment = req.assessment;
    const { questionId, code, timeSpent, timeToFirstKey, typingMetrics } = req.body;

    if (assessment.status !== 'in_progress') {
      return res.status(400).json({ error: 'Assessment not in progress' });
    }

    // Get question and run tests
    const test = await Test.findById(assessment.testId);
    const question = test.questions.id(questionId);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Run AI detection
    const aiAnalysis = AIDetector.analyzeCode(code, typingMetrics);

    // Compile and run tests (simplified - in production use sandboxed execution)
    const testResults = await runTests(code, question.tests, question.language);

    const answer = {
      questionId,
      code,
      timeSpent,
      timeToFirstKey,
      submittedAt: new Date(),
      passed: testResults.allPassed,
      testResults: testResults.results,
      aiAnalysis
    };

    // Check if answer already exists
    const existingAnswerIndex = assessment.answers.findIndex(
      a => a.questionId.toString() === questionId
    );

    if (existingAnswerIndex >= 0) {
      assessment.answers[existingAnswerIndex] = answer;
    } else {
      assessment.answers.push(answer);
    }

    // Update security flags if suspicious
    if (aiAnalysis.overallSuspicionScore > 70) {
      assessment.security.aiDetectionFlags++;
      assessment.security.suspiciousActivityCount++;
    }

    await assessment.save();

    res.json({
      success: true,
      passed: testResults.allPassed,
      testResults: testResults.results,
      aiSuspicionScore: aiAnalysis.overallSuspicionScore
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/assessments/:id/skip-question
// @desc    Skip a question
// @access  Private (Candidate)
router.post('/:id/skip-question', protect, authorize('candidate'), verifyCandidateAccess, async (req, res) => {
  try {
    const assessment = req.assessment;
    const { questionId } = req.body;

    assessment.answers.push({
      questionId,
      skipped: true,
      submittedAt: new Date()
    });

    assessment.performance.questionsSkipped++;
    await assessment.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/assessments/:id/security-violation
// @desc    Report security violation
// @access  Private (Candidate)
router.post('/:id/security-violation', protect, authorize('candidate'), verifyCandidateAccess, async (req, res) => {
  try {
    const assessment = req.assessment;
    const { type, details } = req.body;

    assessment.security.violations.push({
      type,
      timestamp: new Date(),
      details
    });

    // Increment specific counters
    switch (type) {
      case 'tab_switch':
        assessment.security.tabSwitchCount++;
        break;
      case 'copy_attempt':
        assessment.security.copyAttempts++;
        break;
      case 'paste_attempt':
        assessment.security.pasteAttempts++;
        break;
      default:
        assessment.security.suspiciousActivityCount++;
    }

    // Auto-terminate if too many violations
    if (assessment.security.violations.length >= 10) {
      await assessment.terminate('Too many security violations');
      return res.json({ success: true, terminated: true });
    }

    await assessment.save();

    res.json({ success: true, violationCount: assessment.security.violations.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/assessments/:id/complete
// @desc    Complete an assessment
// @access  Private (Candidate)
router.post('/:id/complete', protect, authorize('candidate'), verifyCandidateAccess, async (req, res) => {
  try {
    const assessment = req.assessment;

    if (assessment.status !== 'in_progress') {
      return res.status(400).json({ error: 'Assessment not in progress' });
    }

    assessment.status = 'completed';
    assessment.completedAt = new Date();
    assessment.totalTimeSpent = Math.floor((assessment.completedAt - assessment.startedAt) / 1000);

    // Calculate performance metrics
    assessment.performance.questionsCompleted = assessment.answers.filter(a => !a.skipped).length;
    assessment.performance.questionsPassedAllTests = assessment.answers.filter(a => a.passed).length;
    assessment.performance.overallScore = assessment.calculateScore();

    await assessment.save();

    res.json({
      success: true,
      assessment: {
        id: assessment._id,
        status: assessment.status,
        score: assessment.performance.overallScore,
        completedAt: assessment.completedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/assessments/:id
// @desc    Get assessment details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate('candidateId', 'firstName lastName email')
      .populate('testId', 'title description config');

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Check authorization
    if (req.user.role === 'candidate' && assessment.candidateId._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (req.user.role === 'employer' && assessment.employerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({ success: true, assessment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to run tests (simplified)
async function runTests(code, tests, language) {
  // In production, this should use a secure sandbox environment
  // For now, this is a placeholder
  const results = [];
  let allPassed = true;

  if (language === 'javascript') {
    try {
      // Very basic and unsafe - DO NOT USE IN PRODUCTION
      const func = new Function('return ' + code)();

      for (const test of tests) {
        try {
          const result = Array.isArray(test.input)
            ? func(...test.input)
            : func(test.input);

          const passed = JSON.stringify(result) === JSON.stringify(test.expected);

          results.push({
            input: test.input,
            expected: test.expected,
            actual: result,
            passed
          });

          if (!passed) allPassed = false;
        } catch (error) {
          results.push({
            input: test.input,
            error: error.message,
            passed: false
          });
          allPassed = false;
        }
      }
    } catch (error) {
      return {
        allPassed: false,
        results: [{ error: 'Compilation error: ' + error.message }]
      };
    }
  }

  return { allPassed, results };
}

module.exports = router;

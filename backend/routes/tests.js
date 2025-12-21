const express = require('express');
const Test = require('../models/Test');
const Assessment = require('../models/Assessment');
const Candidate = require('../models/Candidate');
const { protect, authorize, verifyEmployerAccess } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();

// @route   GET /api/tests
// @desc    Get all tests for employer
// @access  Private (Employer)
router.get('/', protect, authorize('employer'), async (req, res) => {
  try {
    const tests = await Test.find({ employerId: req.employer._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tests.length, tests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/tests
// @desc    Create new test
// @access  Private (Employer)
router.post('/', protect, authorize('employer'), async (req, res) => {
  try {
    const test = await Test.create({
      ...req.body,
      employerId: req.employer._id
    });

    // Update employer stats
    req.employer.stats.totalTests++;
    await req.employer.save();

    res.status(201).json({ success: true, test });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/tests/:id
// @desc    Get single test
// @access  Private (Employer)
router.get('/:id', protect, authorize('employer'), verifyEmployerAccess, async (req, res) => {
  try {
    res.json({ success: true, test: req.test });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/tests/:id
// @desc    Update test
// @access  Private (Employer)
router.put('/:id', protect, authorize('employer'), verifyEmployerAccess, async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ success: true, test });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/tests/:id
// @desc    Delete test
// @access  Private (Employer)
router.delete('/:id', protect, authorize('employer'), verifyEmployerAccess, async (req, res) => {
  try {
    await Test.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Test deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/tests/:id/invite
// @desc    Invite candidate to take test
// @access  Private (Employer)
router.post('/:id/invite', protect, authorize('employer'), verifyEmployerAccess, async (req, res) => {
  try {
    const { email, firstName, lastName, expiresInDays = 7 } = req.body;

    // Find or create candidate
    let candidate = await Candidate.findOne({ email });

    if (!candidate) {
      // Generate access code
      const accessCode = crypto.randomBytes(4).toString('hex').toUpperCase();

      candidate = await Candidate.create({
        email,
        firstName,
        lastName,
        accessCode
      });
    }

    // Create assessment
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const assessment = await Assessment.create({
      candidateId: candidate._id,
      testId: req.params.id,
      employerId: req.employer._id,
      status: 'not_started'
    });

    // Add to candidate's assessments
    candidate.assessments.push({
      assessmentId: assessment._id,
      status: 'invited',
      invitedAt: new Date(),
      expiresAt
    });

    await candidate.save();

    // Update employer stats
    req.employer.stats.totalCandidates++;
    req.employer.stats.totalAssessments++;
    await req.employer.save();

    // In production, send email with access code here

    res.status(201).json({
      success: true,
      assessment: {
        id: assessment._id,
        candidateEmail: email,
        expiresAt
      },
      message: 'Candidate invited successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/tests/:id/results
// @desc    Get all results for a test
// @access  Private (Employer)
router.get('/:id/results', protect, authorize('employer'), verifyEmployerAccess, async (req, res) => {
  try {
    const assessments = await Assessment.find({
      testId: req.params.id,
      employerId: req.employer._id
    })
      .populate('candidateId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: assessments.length, assessments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require('express');
const Candidate = require('../models/Candidate');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/candidates
// @desc    Get all candidates for employer
// @access  Private (Employer)
router.get('/', protect, authorize('employer'), async (req, res) => {
  try {
    const candidates = await Candidate.find({
      'assessments.employerId': req.employer._id
    }).select('-accessCode');

    res.json({ success: true, count: candidates.length, candidates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/candidates/:id
// @desc    Get single candidate
// @access  Private (Employer)
router.get('/:id', protect, authorize('employer'), async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .select('-accessCode')
      .populate('assessments.assessmentId');

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json({ success: true, candidate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

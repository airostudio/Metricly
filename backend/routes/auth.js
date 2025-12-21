const express = require('express');
const jwt = require('jsonwebtoken');
const Employer = require('../models/Employer');
const Candidate = require('../models/Candidate');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

// @route   POST /api/auth/employer/register
// @desc    Register new employer
// @access  Public
router.post('/employer/register', async (req, res) => {
  try {
    const { email, password, companyName, firstName, lastName } = req.body;

    // Check if employer exists
    const existingEmployer = await Employer.findOne({ email });
    if (existingEmployer) {
      return res.status(400).json({ error: 'Employer already exists' });
    }

    // Create employer
    const employer = await Employer.create({
      email,
      password,
      'company.name': companyName,
      'contactPerson.firstName': firstName,
      'contactPerson.lastName': lastName
    });

    const token = generateToken(employer._id, 'employer');

    res.status(201).json({
      success: true,
      token,
      employer: {
        id: employer._id,
        email: employer.email,
        company: employer.company,
        role: 'employer'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/auth/employer/login
// @desc    Login employer
// @access  Public
router.post('/employer/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Find employer and include password
    const employer = await Employer.findOne({ email }).select('+password');

    if (!employer) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await employer.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    employer.lastLogin = new Date();
    await employer.save();

    const token = generateToken(employer._id, 'employer');

    res.json({
      success: true,
      token,
      employer: {
        id: employer._id,
        email: employer.email,
        company: employer.company,
        role: 'employer'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/auth/candidate/access
// @desc    Candidate access with code
// @access  Public
router.post('/candidate/access', async (req, res) => {
  try {
    const { email, accessCode, assessmentId } = req.body;

    // Find or create candidate
    let candidate = await Candidate.findOne({ email });

    if (!candidate) {
      return res.status(404).json({ error: 'Invalid access code or email' });
    }

    // Verify access code
    const isValid = await candidate.compareAccessCode(accessCode);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid access code' });
    }

    // Check if candidate has access to this assessment
    const hasAccess = candidate.assessments.some(
      a => a.assessmentId.toString() === assessmentId
    );

    if (!hasAccess) {
      return res.status(403).json({ error: 'Not authorized for this assessment' });
    }

    const token = generateToken(candidate._id, 'candidate');

    res.json({
      success: true,
      token,
      candidate: {
        id: candidate._id,
        email: candidate.email,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        role: 'candidate'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    if (req.user.role === 'employer') {
      const employer = await Employer.findById(req.user.id);
      res.json({
        success: true,
        user: {
          id: employer._id,
          email: employer.email,
          company: employer.company,
          subscription: employer.subscription,
          role: 'employer'
        }
      });
    } else if (req.user.role === 'candidate') {
      const candidate = await Candidate.findById(req.user.id);
      res.json({
        success: true,
        user: {
          id: candidate._id,
          email: candidate.email,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          role: 'candidate'
        }
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

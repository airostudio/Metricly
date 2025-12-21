const jwt = require('jsonwebtoken');
const Employer = require('../models/Employer');
const Candidate = require('../models/Candidate');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if employer or candidate
    if (decoded.role === 'employer') {
      req.employer = await Employer.findById(decoded.id);
    } else if (decoded.role === 'candidate') {
      req.candidate = await Candidate.findById(decoded.id);
    }

    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized to access this route' });
  }
};

// Restrict to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Verify candidate access to specific assessment
exports.verifyCandidateAccess = async (req, res, next) => {
  try {
    const Assessment = require('../models/Assessment');
    const assessmentId = req.params.id || req.body.assessmentId;

    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    if (assessment.candidateId.toString() !== req.candidate._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to access this assessment' });
    }

    req.assessment = assessment;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// Verify employer access to test/assessment
exports.verifyEmployerAccess = async (req, res, next) => {
  try {
    const Test = require('../models/Test');
    const testId = req.params.id || req.body.testId;

    const test = await Test.findById(testId);

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    if (test.employerId.toString() !== req.employer._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to access this test' });
    }

    req.test = test;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

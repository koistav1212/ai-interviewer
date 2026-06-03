const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const jobRoutes = require('./jobRoutes');
const candidateRoutes = require('./candidateRoutes');
const applicationRoutes = require('./applicationRoutes');
const interviewRoutes = require('./interviewRoutes');
const reportRoutes = require('./reportRoutes');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const jobController = require('../controllers/jobController');

// Mount sub-routers
router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/candidate', candidateRoutes);
router.use('/applications', applicationRoutes);
router.use('/interviews', interviewRoutes);
router.use('/reports', reportRoutes);

// Spec requirement: GET /dashboard/recruiter
router.get('/dashboard/recruiter', authMiddleware, roleMiddleware(['RECRUITER', 'ADMIN']), jobController.getRecruiterDashboard);

module.exports = router;

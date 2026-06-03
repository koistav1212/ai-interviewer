const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.post('/profile', roleMiddleware(['CANDIDATE']), candidateController.updateProfile);
router.get('/dashboard', roleMiddleware(['CANDIDATE']), candidateController.getCandidateDashboard);
router.get('/jobs', candidateController.getAllActiveJobs);
router.post('/jobs/:jobId/apply', roleMiddleware(['CANDIDATE']), candidateController.applyForJob);

module.exports = router;

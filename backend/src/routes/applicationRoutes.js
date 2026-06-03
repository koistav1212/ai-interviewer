const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const candidateController = require('../controllers/candidateController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/my', roleMiddleware(['CANDIDATE']), candidateController.getMyApplications);
router.get('/job/:jobId', roleMiddleware(['RECRUITER', 'ADMIN']), applicationController.getApplicationsByJob);
router.get('/:id', applicationController.getApplicationById);
router.post('/:id/status', roleMiddleware(['RECRUITER', 'ADMIN']), applicationController.updateApplicationStatus);

module.exports = router;

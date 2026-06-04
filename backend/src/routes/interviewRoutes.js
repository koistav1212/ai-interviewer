const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.post('/create', roleMiddleware(['RECRUITER', 'ADMIN']), interviewController.createInterview);
router.get('/candidate', roleMiddleware(['CANDIDATE']), interviewController.getInterviewsByCandidate);
router.get('/recruiter', roleMiddleware(['RECRUITER', 'ADMIN']), interviewController.getInterviewsByRecruiter);
router.get('/:id', interviewController.getInterviewDetails);
router.post('/:id/score', roleMiddleware(['RECRUITER', 'ADMIN']), interviewController.submitScores);
router.post('/:id/start', roleMiddleware(['CANDIDATE']), interviewController.startInterview);

module.exports = router;

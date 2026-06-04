const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/candidate/:id', reportController.getCandidateReport);
router.get('/job/:id', roleMiddleware(['RECRUITER', 'ADMIN']), reportController.getJobReport);
router.get('/dashboard', roleMiddleware(['RECRUITER', 'ADMIN']), reportController.getReportsDashboard);
router.post('/generate', roleMiddleware(['RECRUITER', 'ADMIN', 'CANDIDATE']), reportController.generateMatchReport);

module.exports = router;

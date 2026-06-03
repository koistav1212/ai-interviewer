const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.post('/create', roleMiddleware(['RECRUITER', 'ADMIN']), jobController.createJob);
router.get('/my-jobs', roleMiddleware(['RECRUITER', 'ADMIN']), jobController.getMyJobs);
router.get('/:id', jobController.getJobDetails);

// Note: the endpoints use Application ID under the hood
router.post('/:id/shortlist', roleMiddleware(['RECRUITER', 'ADMIN']), jobController.shortlistApplication);
router.post('/:id/schedule-interview', roleMiddleware(['RECRUITER', 'ADMIN']), jobController.scheduleInterview);

module.exports = router;

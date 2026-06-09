const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

router.post('/create', roleMiddleware(['RECRUITER', 'ADMIN']), jobController.createJob);
router.post('/upload-jd', roleMiddleware(['RECRUITER', 'ADMIN']), upload.single('jdFile'), jobController.uploadJD);
router.get('/my-jobs', roleMiddleware(['RECRUITER', 'ADMIN']), jobController.getMyJobs);
router.get('/:id', jobController.getJobDetails);
router.post('/:id/ingest', roleMiddleware(['RECRUITER', 'ADMIN']), jobController.ingestJob);

// Note: the endpoints use Application ID under the hood
router.post('/:id/shortlist', roleMiddleware(['RECRUITER', 'ADMIN']), jobController.shortlistApplication);
router.post('/:id/schedule-interview', roleMiddleware(['RECRUITER', 'ADMIN']), jobController.scheduleInterview);

module.exports = router;

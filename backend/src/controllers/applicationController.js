const { Application, Job } = require('../models');

exports.getApplicationsByJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const applications = await Application.find({ jobId })
      .populate({
        path: 'candidate',
        select: 'id name email',
        populate: { path: 'profile' }
      })
      .sort({ createdAt: -1 });
    return res.status(200).json(applications);
  } catch (err) {
    next(err);
  }
};

exports.getApplicationById = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job')
      .populate({
        path: 'candidate',
        select: 'id name email'
      });
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    return res.status(200).json(application);
  } catch (err) {
    next(err);
  }
};

exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['APPLIED', 'SHORTLISTED', 'REJECTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'SELECTED'];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid or missing application status' });
    }

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = status.toUpperCase();
    await application.save();

    return res.status(200).json({ message: 'Status updated successfully', application });
  } catch (err) {
    next(err);
  }
};

exports.getRecruiterApplications = async (req, res, next) => {
  try {
    const recruiterId = req.user.id;
    
    // Find all jobs posted by the recruiter
    const recruiterJobs = await Job.find({ recruiterId }).select('_id');
    const jobIds = recruiterJobs.map(job => job._id);

    // Find all applications for those jobs
    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate('job')
      .populate({
        path: 'candidate',
        select: 'id name email'
      })
      .sort({ createdAt: -1 });

    return res.status(200).json(applications);
  } catch (err) {
    next(err);
  }
};

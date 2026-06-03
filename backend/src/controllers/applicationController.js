const { Application, Job, User, CandidateProfile } = require('../models');

exports.getApplicationsByJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const applications = await Application.findAll({
      where: { jobId },
      include: [
        {
          model: User,
          as: 'candidate',
          attributes: ['id', 'name', 'email'],
          include: [{ model: CandidateProfile, as: 'profile' }]
        }
      ],
      order: [['createdAt', 'DESC']],
    });
    return res.status(200).json(applications);
  } catch (err) {
    next(err);
  }
};

exports.getApplicationById = async (req, res, next) => {
  try {
    const application = await Application.findByPk(req.params.id, {
      include: [
        { model: Job, as: 'job' },
        { model: User, as: 'candidate', attributes: ['id', 'name', 'email'] }
      ],
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

    const application = await Application.findByPk(id);
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

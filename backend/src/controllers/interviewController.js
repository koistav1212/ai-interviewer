const { Interview, InterviewScore, Application, Job } = require('../models');

exports.createInterview = async (req, res, next) => {
  try {
    const { applicationId, scheduledTime, meetingLink } = req.body;

    if (!applicationId || !scheduledTime) {
      return res.status(400).json({ message: 'applicationId and scheduledTime are required' });
    }

    const app = await Application.findById(applicationId);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const interview = await Interview.create({
      applicationId,
      scheduledTime,
      meetingLink,
      status: 'SCHEDULED',
    });

    app.status = 'INTERVIEW_SCHEDULED';
    await app.save();

    return res.status(201).json(interview);
  } catch (err) {
    next(err);
  }
};

exports.getInterviewDetails = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate({
        path: 'application',
        populate: [
          { path: 'job' },
          { path: 'candidate', select: 'id name email' }
        ]
      })
      .populate('score');
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    return res.status(200).json(interview);
  } catch (err) {
    next(err);
  }
};

exports.getInterviewsByCandidate = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    
    // Find all applications for this candidate
    const applications = await Application.find({ candidateId }).select('_id');
    const appIds = applications.map(app => app._id);

    const interviews = await Interview.find({ applicationId: { $in: appIds } })
      .populate({
        path: 'application',
        populate: { path: 'job' }
      })
      .populate('score')
      .sort({ scheduledTime: -1 });

    return res.status(200).json(interviews);
  } catch (err) {
    next(err);
  }
};

exports.getInterviewsByRecruiter = async (req, res, next) => {
  try {
    const recruiterId = req.user.id;

    // Find all jobs posted by the recruiter
    const recruiterJobs = await Job.find({ recruiterId }).select('_id');
    const jobIds = recruiterJobs.map(job => job._id);

    // Find all applications for those jobs
    const applications = await Application.find({ jobId: { $in: jobIds } }).select('_id');
    const appIds = applications.map(app => app._id);

    const interviews = await Interview.find({ applicationId: { $in: appIds } })
      .populate({
        path: 'application',
        populate: [
          { path: 'job' },
          { path: 'candidate', select: 'id name email' }
        ]
      })
      .populate('score')
      .sort({ scheduledTime: -1 });

    return res.status(200).json(interviews);
  } catch (err) {
    next(err);
  }
};

exports.submitScores = async (req, res, next) => {
  try {
    const { id } = req.params; // Interview ID
    const { technicalScore, communicationScore, leadershipScore, businessAcumenScore, feedback } = req.body;

    if (technicalScore === undefined || communicationScore === undefined || leadershipScore === undefined || businessAcumenScore === undefined) {
      return res.status(400).json({ message: 'All scores (technical, communication, leadership, businessAcumen) are required' });
    }

    const interview = await Interview.findById(id).populate('application');
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    const t = parseFloat(technicalScore);
    const c = parseFloat(communicationScore);
    const l = parseFloat(leadershipScore);
    const b = parseFloat(businessAcumenScore);
    const overallScore = ((t + c + l + b) / 4).toFixed(2);

    // If score already exists, update it, otherwise create
    let score = await InterviewScore.findOne({ interviewId: id });
    if (score) {
      score.technicalScore = t;
      score.communicationScore = c;
      score.leadershipScore = l;
      score.businessAcumenScore = b;
      score.overallScore = parseFloat(overallScore);
      score.feedback = feedback || score.feedback;
      await score.save();
    } else {
      score = await InterviewScore.create({
        interviewId: id,
        technicalScore: t,
        communicationScore: c,
        leadershipScore: l,
        businessAcumenScore: b,
        overallScore: parseFloat(overallScore),
        feedback,
      });
    }

    interview.status = 'COMPLETED';
    await interview.save();

    if (interview.application) {
      const app = await Application.findById(interview.application.id);
      if (app) {
        app.status = 'INTERVIEW_COMPLETED';
        await app.save();
      }
    }

    return res.status(200).json({ message: 'Interview scores recorded successfully', score });
  } catch (err) {
    next(err);
  }
};

exports.startInterview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { duration } = req.body;

    if (!duration) {
      return res.status(400).json({ message: 'Duration is required' });
    }

    const interview = await Interview.findById(id);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    interview.duration = parseInt(duration, 10);
    await interview.save();

    return res.status(200).json(interview);
  } catch (err) {
    next(err);
  }
};

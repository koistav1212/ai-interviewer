const { Interview, InterviewScore, Application, Job, User } = require('../models');

exports.createInterview = async (req, res, next) => {
  try {
    const { applicationId, scheduledTime, meetingLink } = req.body;

    if (!applicationId || !scheduledTime) {
      return res.status(400).json({ message: 'applicationId and scheduledTime are required' });
    }

    const app = await Application.findByPk(applicationId);
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
    const interview = await Interview.findByPk(req.params.id, {
      include: [
        {
          model: Application,
          as: 'application',
          include: [
            { model: Job, as: 'job' },
            { model: User, as: 'candidate', attributes: ['id', 'name', 'email'] }
          ]
        },
        { model: InterviewScore, as: 'score' }
      ]
    });
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    return res.status(200).json(interview);
  } catch (err) {
    next(err);
  }
};

exports.getInterviewsByCandidate = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    const interviews = await Interview.findAll({
      include: [
        {
          model: Application,
          as: 'application',
          where: { candidateId },
          include: [{ model: Job, as: 'job' }]
        },
        { model: InterviewScore, as: 'score' }
      ],
      order: [['scheduledTime', 'DESC']]
    });
    return res.status(200).json(interviews);
  } catch (err) {
    next(err);
  }
};

exports.getInterviewsByRecruiter = async (req, res, next) => {
  try {
    const recruiterId = req.user.id;
    const interviews = await Interview.findAll({
      include: [
        {
          model: Application,
          as: 'application',
          include: [
            {
              model: Job,
              as: 'job',
              where: { recruiterId }
            },
            {
              model: User,
              as: 'candidate',
              attributes: ['id', 'name', 'email']
            }
          ]
        },
        { model: InterviewScore, as: 'score' }
      ],
      order: [['scheduledTime', 'DESC']]
    });
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

    const interview = await Interview.findByPk(id, { include: ['application'] });
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    const t = parseFloat(technicalScore);
    const c = parseFloat(communicationScore);
    const l = parseFloat(leadershipScore);
    const b = parseFloat(businessAcumenScore);
    const overallScore = ((t + c + l + b) / 4).toFixed(2);

    // If score already exists, update it, otherwise create
    let score = await InterviewScore.findOne({ where: { interviewId: id } });
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
      interview.application.status = 'INTERVIEW_COMPLETED';
      await interview.application.save();
    }

    return res.status(200).json({ message: 'Interview scores recorded successfully', score });
  } catch (err) {
    next(err);
  }
};

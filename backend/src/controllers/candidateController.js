const { QueryTypes } = require('sequelize');
const { CandidateProfile, Job, Application, sequelize } = require('../models');

exports.updateProfile = async (req, res, next) => {
  try {
    const { resumeUrl, resumeText, skills, experienceYears } = req.body;
    const userId = req.user.id;

    let profile = await CandidateProfile.findOne({ where: { userId } });
    if (profile) {
      profile.resumeUrl = resumeUrl || profile.resumeUrl;
      profile.resumeText = resumeText || profile.resumeText;
      profile.skills = skills || profile.skills;
      profile.experienceYears = experienceYears !== undefined ? experienceYears : profile.experienceYears;
      await profile.save();
    } else {
      profile = await CandidateProfile.create({
        userId,
        resumeUrl,
        resumeText,
        skills: skills || [],
        experienceYears: experienceYears || 0.0,
      });
    }

    return res.status(200).json({ message: 'Profile updated successfully', profile });
  } catch (err) {
    next(err);
  }
};

exports.getAllActiveJobs = async (req, res, next) => {
  try {
    const jobs = await Job.findAll({
      where: { status: 'ACTIVE' },
      include: ['skills'],
      order: [['createdAt', 'DESC']],
    });
    return res.status(200).json(jobs);
  } catch (err) {
    next(err);
  }
};

exports.applyForJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const candidateId = req.user.id;

    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const existing = await Application.findOne({ where: { jobId, candidateId } });
    if (existing) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    const application = await Application.create({
      jobId,
      candidateId,
      status: 'APPLIED',
    });

    return res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (err) {
    next(err);
  }
};

exports.getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.findAll({
      where: { candidateId: req.user.id },
      include: [
        { model: Job, as: 'job', include: ['skills'] }
      ],
      order: [['createdAt', 'DESC']],
    });
    return res.status(200).json(applications);
  } catch (err) {
    next(err);
  }
};

exports.getCandidateDashboard = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    const isSqlite = sequelize.options.dialect === 'sqlite';

    const query = isSqlite 
      ? `SELECT 
          COUNT(*) AS totalApplications,
          COUNT(CASE WHEN status = 'INTERVIEW_SCHEDULED' THEN 1 END) AS interviewsScheduled,
          COUNT(CASE WHEN status = 'INTERVIEW_COMPLETED' THEN 1 END) AS interviewsCompleted,
          COUNT(CASE WHEN status = 'SELECTED' THEN 1 END) AS selectedJobs
        FROM applications
        WHERE candidate_id = :candidateId`
      : `SELECT 
          COUNT(*) AS "totalApplications",
          COUNT(CASE WHEN status = 'INTERVIEW_SCHEDULED' THEN 1 END) AS "interviewsScheduled",
          COUNT(CASE WHEN status = 'INTERVIEW_COMPLETED' THEN 1 END) AS "interviewsCompleted",
          COUNT(CASE WHEN status = 'SELECTED' THEN 1 END) AS "selectedJobs"
        FROM applications
        WHERE candidate_id = :candidateId`;

    const stats = await sequelize.query(query, {
      replacements: { candidateId },
      type: QueryTypes.SELECT,
      plain: true
    });

    const responseData = {
      totalApplications: Number(stats?.totalApplications || 0),
      interviewsScheduled: Number(stats?.interviewsScheduled || 0),
      interviewsCompleted: Number(stats?.interviewsCompleted || 0),
      selectedJobs: Number(stats?.selectedJobs || 0),
    };

    return res.status(200).json(responseData);
  } catch (err) {
    next(err);
  }
};

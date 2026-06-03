const { QueryTypes } = require('sequelize');
const { Job, JobSkill, Application, Interview, sequelize } = require('../models');

exports.createJob = async (req, res, next) => {
  try {
    const { title, description, location, salaryRange, skills } = req.body;
    const recruiterId = req.user.id;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const job = await Job.create({
      recruiterId,
      title,
      description,
      location,
      salaryRange,
    });

    if (skills && Array.isArray(skills)) {
      const skillsData = skills.map(skill => ({
        jobId: job.id,
        skillName: typeof skill === 'string' ? skill : skill.name,
        importance: skill.importance || 'REQUIRED',
      }));
      await JobSkill.bulkCreate(skillsData);
    }

    const fullJob = await Job.findByPk(job.id, { include: ['skills'] });
    return res.status(201).json(fullJob);
  } catch (err) {
    next(err);
  }
};

exports.getMyJobs = async (req, res, next) => {
  try {
    const jobs = await Job.findAll({
      where: { recruiterId: req.user.id },
      include: ['skills'],
      order: [['createdAt', 'DESC']],
    });
    return res.status(200).json(jobs);
  } catch (err) {
    next(err);
  }
};

exports.getJobDetails = async (req, res, next) => {
  try {
    const job = await Job.findByPk(req.params.id, { include: ['skills'] });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    return res.status(200).json(job);
  } catch (err) {
    next(err);
  }
};

exports.shortlistApplication = async (req, res, next) => {
  try {
    const { id } = req.params; // Application ID
    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = 'SHORTLISTED';
    await application.save();

    return res.status(200).json({ message: 'Candidate shortlisted successfully', application });
  } catch (err) {
    next(err);
  }
};

exports.scheduleInterview = async (req, res, next) => {
  try {
    const { id } = req.params; // Application ID
    const { scheduledTime, meetingLink } = req.body;

    if (!scheduledTime) {
      return res.status(400).json({ message: 'Scheduled time is required' });
    }

    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const interview = await Interview.create({
      applicationId: application.id,
      scheduledTime,
      meetingLink,
      status: 'SCHEDULED',
    });

    application.status = 'INTERVIEW_SCHEDULED';
    await application.save();

    return res.status(201).json({ message: 'Interview scheduled successfully', interview });
  } catch (err) {
    next(err);
  }
};

exports.getRecruiterDashboard = async (req, res, next) => {
  try {
    const recruiterId = req.user.id;
    const isSqlite = sequelize.options.dialect === 'sqlite';

    const query = isSqlite 
      ? `SELECT 
          (SELECT COUNT(*) FROM jobs WHERE recruiter_id = :recruiterId) AS totalJobs,
          (SELECT COUNT(*) FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.recruiter_id = :recruiterId) AS totalApplications,
          (SELECT COUNT(*) FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.recruiter_id = :recruiterId AND a.status = 'SHORTLISTED') AS totalShortlisted,
          (SELECT COUNT(*) FROM interviews i JOIN applications a ON i.application_id = a.id JOIN jobs j ON a.job_id = j.id WHERE j.recruiter_id = :recruiterId) AS totalInterviews,
          (SELECT COUNT(*) FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.recruiter_id = :recruiterId AND a.status = 'SELECTED') AS totalSelected`
      : `SELECT 
          (SELECT COUNT(*) FROM jobs WHERE recruiter_id = :recruiterId) AS "totalJobs",
          (SELECT COUNT(*) FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.recruiter_id = :recruiterId) AS "totalApplications",
          (SELECT COUNT(*) FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.recruiter_id = :recruiterId AND a.status = 'SHORTLISTED') AS "totalShortlisted",
          (SELECT COUNT(*) FROM interviews i JOIN applications a ON i.application_id = a.id JOIN jobs j ON a.job_id = j.id WHERE j.recruiter_id = :recruiterId) AS "totalInterviews",
          (SELECT COUNT(*) FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.recruiter_id = :recruiterId AND a.status = 'SELECTED') AS "totalSelected"`;

    const stats = await sequelize.query(query, {
      replacements: { recruiterId },
      type: QueryTypes.SELECT,
      plain: true
    });

    const responseData = {
      totalJobs: Number(stats?.totalJobs || stats?.totalJobs || 0),
      totalApplications: Number(stats?.totalApplications || stats?.totalApplications || 0),
      totalShortlisted: Number(stats?.totalShortlisted || stats?.totalShortlisted || 0),
      totalInterviews: Number(stats?.totalInterviews || stats?.totalInterviews || 0),
      totalSelected: Number(stats?.totalSelected || stats?.totalSelected || 0),
    };

    return res.status(200).json(responseData);
  } catch (err) {
    next(err);
  }
};

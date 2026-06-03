const { Report, Application, Job, User, CandidateProfile, sequelize } = require('../models');

exports.getCandidateReport = async (req, res, next) => {
  try {
    const { id } = req.params; // Application ID
    const report = await Report.findOne({
      where: { applicationId: id },
      include: [
        {
          model: Application,
          as: 'application',
          include: [
            { model: Job, as: 'job' },
            { model: User, as: 'candidate', attributes: ['id', 'name', 'email'] }
          ]
        }
      ]
    });

    if (!report) return res.status(404).json({ message: 'Report not generated yet for this application' });
    return res.status(200).json(report);
  } catch (err) {
    next(err);
  }
};

exports.getJobReport = async (req, res, next) => {
  try {
    const { id } = req.params; // Job ID
    const reports = await Report.findAll({
      include: [
        {
          model: Application,
          as: 'application',
          where: { jobId: id },
          include: [
            { model: User, as: 'candidate', attributes: ['id', 'name', 'email'] }
          ]
        }
      ],
      order: [['matchScore', 'DESC']]
    });
    return res.status(200).json(reports);
  } catch (err) {
    next(err);
  }
};

exports.generateMatchReport = async (req, res, next) => {
  try {
    const { applicationId } = req.body;
    if (!applicationId) {
      return res.status(400).json({ message: 'applicationId is required' });
    }

    const app = await Application.findByPk(applicationId, {
      include: [
        { model: Job, as: 'job', include: ['skills'] },
        { model: User, as: 'candidate', include: [{ model: CandidateProfile, as: 'profile' }] }
      ]
    });

    if (!app) return res.status(404).json({ message: 'Application not found' });

    const jdText = (app.job.description || '').toLowerCase();
    const resumeText = (app.candidate.profile?.resumeText || '').toLowerCase();
    const jobSkills = app.job.skills.map(s => s.skillName.toLowerCase());

    let matchedSkills = [];
    let gapSkills = [];

    if (jobSkills.length > 0) {
      matchedSkills = jobSkills.filter(skill => resumeText.includes(skill) || jdText.includes(skill));
      gapSkills = jobSkills.filter(skill => !resumeText.includes(skill));
    }

    const matchRatio = jobSkills.length > 0 ? (matchedSkills.length / jobSkills.length) : 0.5;
    const matchScore = (matchRatio * 100).toFixed(2);

    let report = await Report.findOne({ where: { applicationId } });
    if (report) {
      report.matchScore = parseFloat(matchScore);
      report.summary = `Candidate matches ${matchedSkills.length} out of ${jobSkills.length} core job skills.`;
      report.strengthPoints = matchedSkills;
      report.gapPoints = gapSkills;
      await report.save();
    } else {
      report = await Report.create({
        applicationId,
        matchScore: parseFloat(matchScore),
        summary: `Candidate matches ${matchedSkills.length} out of ${jobSkills.length} core job skills.`,
        strengthPoints: matchedSkills,
        gapPoints: gapSkills,
      });
    }

    return res.status(201).json(report);
  } catch (err) {
    next(err);
  }
};

exports.getReportsDashboard = async (req, res, next) => {
  try {
    const reportsCount = await Report.count();
    const averageMatchScoreResult = await Report.findOne({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('match_score')), 'avgScore']
      ],
      raw: true
    });

    const averageMatchScore = parseFloat(averageMatchScoreResult?.avgScore || 0).toFixed(2);

    return res.status(200).json({
      totalReportsGenerated: reportsCount,
      averageMatchScore: parseFloat(averageMatchScore)
    });
  } catch (err) {
    next(err);
  }
};

const { Report, Application, Job } = require('../models');

exports.getCandidateReport = async (req, res, next) => {
  try {
    const { id } = req.params; // Application ID
    const report = await Report.findOne({ applicationId: id })
      .populate({
        path: 'application',
        populate: [
          { path: 'job' },
          { path: 'candidate', select: 'id name email' }
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
    
    // Find all applications for the jobId
    const applications = await Application.find({ jobId: id }).select('_id');
    const appIds = applications.map(app => app._id);

    // Find all reports for those applications
    const reports = await Report.find({ applicationId: { $in: appIds } })
      .populate({
        path: 'application',
        populate: {
          path: 'candidate',
          select: 'id name email'
        }
      })
      .sort({ matchScore: -1 });

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

    const app = await Application.findById(applicationId)
      .populate('job')
      .populate({
        path: 'candidate',
        populate: { path: 'profile' }
      });

    if (!app) return res.status(404).json({ message: 'Application not found' });

    const jdText = (app.job.description || '').toLowerCase();
    const resumeText = (app.candidate.profile?.resumeText || '').toLowerCase();
    
    // skills are embedded inside app.job.skills
    const jobSkills = (app.job.skills || []).map(s => s.skillName.toLowerCase());

    let matchedSkills = [];
    let gapSkills = [];

    if (jobSkills.length > 0) {
      matchedSkills = jobSkills.filter(skill => resumeText.includes(skill) || jdText.includes(skill));
      gapSkills = jobSkills.filter(skill => !resumeText.includes(skill));
    }

    const matchRatio = jobSkills.length > 0 ? (matchedSkills.length / jobSkills.length) : 0.5;
    const matchScore = (matchRatio * 100).toFixed(2);

    let report = await Report.findOne({ applicationId });
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
    const reportsCount = await Report.countDocuments();
    
    const avgResult = await Report.aggregate([
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$matchScore' }
        }
      }
    ]);

    const averageMatchScore = avgResult.length > 0 ? parseFloat(avgResult[0].avgScore || 0).toFixed(2) : '0.00';

    return res.status(200).json({
      totalReportsGenerated: reportsCount,
      averageMatchScore: parseFloat(averageMatchScore)
    });
  } catch (err) {
    next(err);
  }
};

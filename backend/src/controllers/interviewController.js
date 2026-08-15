const { Interview, InterviewScore, Application, Job } = require('../models');
const { getEmbedding } = require('../services/embeddingService');
// Qdrant retrieval is now handled dynamically by the Python AI Service (Retrieval Router).
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

    // Role-based authorization
    const currentUser = req.user;
    
    // Candidate can only access their own interview
    if (currentUser.role === 'CANDIDATE') {
      if (!interview.application || interview.application.candidateId.toString() !== currentUser.id.toString()) {
        return res.status(403).json({ message: 'Access denied: Insufficient privileges' });
      }
    } 
    // Recruiter can access interviews for their own jobs
    else if (currentUser.role === 'RECRUITER' || currentUser.role === 'ADMIN') {
      if (!interview.application || !interview.application.job || interview.application.job.recruiterId.toString() !== currentUser.id.toString()) {
        return res.status(403).json({ message: 'Access denied: Insufficient privileges' });
      }
    } else {
      return res.status(403).json({ message: 'Access denied: Invalid user role' });
    }

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

exports.startInterviewSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findById(id).populate({
      path: 'application',
      populate: [
        { path: 'job' },
        { path: 'candidate', select: 'id name email' }
      ]
    });
    
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const app = interview.application;
    if (!app) {
      return res.status(404).json({ message: 'Application not found for this interview' });
    }
    
    const job = app.job;
    const candidateId = app.candidateId;
    
    // Fetch candidate profile to get resume
    const { CandidateProfile } = require('../models');
    const profile = await CandidateProfile.findOne({ userId: candidateId });
    const resumeText = profile ? profile.resumeText : '';
    
    // Level 1: Stable Interview Context (structured)
    const initialState = {
      sessionId: interview.id,
      candidateId: candidateId.toString(),
      jobId: job.id.toString(),
      
      // Level 1 Memory
      candidate_profile: {
        name: profile?.userId?.name || 'Candidate',
        experience: profile?.experience || []
      },
      resume_entities: { 
        text: resumeText,
        skills: profile?.skills || []
      },
      jd_profile: {
        title: job.title,
        description: job.description,
        skills: job.skills,
        requirements: job.requirements
      },
      interview_blueprint: {
        company: job.company,
        industry: job.industry || 'Technology',
        role: job.title,
        interview_mix: {
          resume_based: 20,
          technical: 20,
          business_case: 20,
          industry: 15,
          behavioral: 10,
          guesstimate: 10,
          hr_motivation: 5
        }
      },
      company_profile: {
        name: job.company
      },
      industry_profile: {
        name: job.industry || 'Technology'
      },

      // Level 3 Memory (Current Answer Memory)
      current_question: '',
      current_answer: '',
      claims: [],
      weaknesses: [],
      technologies: [],
      covered_topics: [],
      uncovered_topics: (job.skills || []).map(s => s.skillName),
      follow_up_depth: 0,
      askedQuestions: [],
      scores: [],
      difficulty: 'medium',
      questionCount: 0,
      completed: false,
      answers: [],
      next_step: null
    };

    // Call FastAPI service
    const aiServiceUrl = process.env.AI_SERVICE_URL;
    if (!aiServiceUrl) {
      throw new Error('AI_SERVICE_URL is not configured');
    }

    console.log(`Sending initial state to FastAPI at ${aiServiceUrl}/interview/next...`);
    const response = await fetch(`${aiServiceUrl}/interview/next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initialState)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`FastAPI responded with error: ${errText}`);
    }

    const updatedState = await response.json();
    
    // Save updated state in MongoDB
    interview.interviewState = updatedState;
    await interview.save();

    return res.status(200).json({
      question: updatedState.current_question,
      completed: updatedState.completed
    });
  } catch (err) {
    next(err);
  }
};

exports.submitAnswer = async (req, res, next) => {
  try {
    const interviewId = req.body.interviewId || req.params.id;
    const answer = req.body.answerText || req.body.answer;
    const questionId = req.body.questionId;
    
    if (!interviewId) {
      return res.status(400).json({ message: 'Interview ID is required' });
    }

    if (!answer) {
      return res.status(400).json({ message: 'Answer is required' });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const state = interview.interviewState;
    if (!state) {
      return res.status(400).json({ message: 'Interview session has not been initialized. Call start-session first.' });
    }

    if (state.completed) {
      return res.status(200).json({
        question: '',
        completed: true
      });
    }

    // Update state with answer
    state.current_answer = answer;
    if (!state.answers) {
      state.answers = [];
    }
    if (state.answers.length < (state.askedQuestions || []).length) {
      state.answers.push(answer);
    }

    // Call FastAPI service to evaluate and transition
    const aiServiceUrl = process.env.AI_SERVICE_URL;
    const response = await fetch(`${aiServiceUrl}/interview/next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`FastAPI responded with error: ${errText}`);
    }

    const updatedState = await response.json();
    
    // Save updated state in MongoDB
    interview.interviewState = updatedState;
    await interview.save();

    return res.status(200).json({
      question: updatedState.current_question,
      completed: updatedState.completed
    });
  } catch (err) {
    next(err);
  }
};

exports.finalizeInterviewSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findById(id).populate('application');
    
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const state = interview.interviewState;
    if (!state) {
      return res.status(400).json({ message: 'Interview session has not been initialized.' });
    }

    // Call FastAPI service to finalize (ReportGeneratorNode)
    const aiServiceUrl = process.env.AI_SERVICE_URL;
    console.log(`Calling FastAPI /interview/finalize to synthesize report...`);
    const response = await fetch(`${aiServiceUrl}/interview/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`FastAPI responded with error: ${errText}`);
    }

    const reportJson = await response.json();

    // Save to MongoDB
    const { InterviewScore, Report, Application } = require('../models');
    const tScore = parseFloat((reportJson.technicalScore / 10).toFixed(1));
    const cScore = parseFloat((reportJson.communicationScore / 10).toFixed(1));
    const overallScore = parseFloat((reportJson.overallScore / 10).toFixed(1));
    
    let score = await InterviewScore.findOne({ interviewId: id });
    if (score) {
      score.technicalScore = tScore;
      score.communicationScore = cScore;
      score.overallScore = overallScore;
      score.feedback = reportJson.feedback || '';
      await score.save();
    } else {
      score = await InterviewScore.create({
        interviewId: id,
        technicalScore: tScore,
        communicationScore: cScore,
        leadershipScore: tScore,
        businessAcumenScore: cScore,
        overallScore: overallScore,
        feedback: reportJson.feedback || ''
      });
    }

    let report = await Report.findOne({ applicationId: interview.applicationId });
    if (report) {
      report.matchScore = reportJson.overallScore || reportJson.technicalScore || 80.0;
      report.summary = reportJson.feedback || '';
      report.strengthPoints = reportJson.strengths || [];
      report.gapPoints = reportJson.weaknesses || [];
      await report.save();
    } else {
      report = await Report.create({
        applicationId: interview.applicationId,
        matchScore: reportJson.overallScore || reportJson.technicalScore || 80.0,
        summary: reportJson.feedback || '',
        strengthPoints: reportJson.strengths || [],
        gapPoints: reportJson.weaknesses || []
      });
    }

    interview.status = 'COMPLETED';
    await interview.save();

    if (interview.application) {
      const app = await Application.findById(interview.applicationId);
      if (app) {
        app.status = 'INTERVIEW_COMPLETED';
        await app.save();
      }
    }

    return res.status(200).json({
      message: 'Interview finalized and reports successfully compiled',
      score,
      report
    });
  } catch (err) {
    next(err);
  }
};

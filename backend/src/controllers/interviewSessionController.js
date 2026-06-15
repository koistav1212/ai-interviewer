const { Job, CandidateProfile, CompanyIntelligence, Application, InterviewSession } = require('../models');
const { getEmbedding } = require('../services/embeddingService');
const { qdrant } = require('../config/qdrant');

// Helper to query Qdrant collections
async function searchResumeKnowledge(candidateId, queryText) {
  try {
    const embedding = await getEmbedding(queryText);
    const results = await qdrant.search('resume_knowledge', {
      vector: embedding,
      filter: {
        must: [{ key: 'candidateId', match: { value: candidateId.toString() } }]
      },
      limit: 5
    });
    return results.map(r => r.payload?.text || '').join('\n\n');
  } catch (err) {
    console.warn('Qdrant resume search failed:', err.message);
    return '';
  }
}

async function searchJobKnowledge(jobId, queryText) {
  try {
    const embedding = await getEmbedding(queryText);
    const results = await qdrant.search('job_knowledge', {
      vector: embedding,
      filter: {
        must: [{ key: 'jobId', match: { value: jobId.toString() } }]
      },
      limit: 5
    });
    return results.map(r => r.payload?.text || '').join('\n\n');
  } catch (err) {
    console.warn('Qdrant job search failed:', err.message);
    return '';
  }
}

async function searchCompanyKnowledge(company, queryText) {
  try {
    if (!company) return '';
    const embedding = await getEmbedding(queryText);
    const results = await qdrant.search('company_knowledge', {
      vector: embedding,
      filter: {
        must: [{ key: 'company', match: { value: company } }]
      },
      limit: 5
    });
    return results.map(r => r.payload?.text || '').join('\n\n');
  } catch (err) {
    console.warn('Qdrant company search failed:', err.message);
    return '';
  }
}

exports.startSession = async (req, res, next) => {
  try {
    const { candidateId, jobId } = req.body;

    if (!candidateId || !jobId) {
      return res.status(400).json({ message: 'candidateId and jobId are required' });
    }

    // 1. Get Candidate Resume
    const profile = await CandidateProfile.findOne({ userId: candidateId });
    if (!profile) {
      return res.status(404).json({ message: 'Candidate profile not found' });
    }
    const resumeText = profile.resumeText || '';

    // 2. Get Job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // 3. Get Company Intelligence
    const company = job.company || '';
    const companyIntel = company ? await CompanyIntelligence.findOne({ company }) : null;
    const companyText = companyIntel ? `
Company: ${companyIntel.company}
Mission: ${companyIntel.mission || ''}
Products: ${(companyIntel.products || []).join(', ')}
Culture: ${companyIntel.culture || ''}
Tech Stack: ${(companyIntel.techStack || []).join(', ')}
Recent News: ${(companyIntel.recentNews || []).join(', ')}
` : `Company: ${company}`;

    // 5. Get/create application
    let app = await Application.findOne({ jobId, candidateId });
    if (!app) {
      app = await Application.create({
        jobId,
        candidateId,
        status: 'INTERVIEW_SCHEDULED'
      });
    }

    // 6. Retrieve chunks from Qdrant
    const searchQuery = `${job.title} ${job.description || ''}`;
    const resumeChunks = await searchResumeKnowledge(candidateId, searchQuery);
    const jobChunks = await searchJobKnowledge(jobId, searchQuery);
    const companyChunks = await searchCompanyKnowledge(company, searchQuery);

    const interviewContext = `
${resumeChunks}

${jobChunks}

${companyChunks}
`.trim();

    // 7. Call AI Service to generate first question
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8002';
    console.log(`🤖 Querying AI Service to generate first question for candidate "${candidateId}"...`);
    
    const aiResponse = await fetch(`${aiServiceUrl}/interview/first-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        resume: resumeText || resumeChunks || 'No resume content available.',
        job: job.description || jobChunks || 'No job context available.',
        company: companyText || companyChunks || 'No company context available.'
      })
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI Service failed to generate first question: ${errText}`);
    }

    const questionResult = await aiResponse.json();
    console.log('✅ First question successfully generated from AI service:', questionResult);

    // 8. Create InterviewSession
    const session = await InterviewSession.create({
      candidateId,
      jobId,
      applicationId: app._id,
      status: "IN_PROGRESS",
      questionCount: 1,
      currentDifficulty: questionResult.difficulty || "medium",
      coveredTopics: questionResult.topic ? [questionResult.topic] : [],
      askedQuestions: [questionResult.question],
      answers: [],
      evaluations: [],
      overallScore: 0,
      startedAt: new Date()
    });

    console.log(`💾 Created interview session with ID: ${session._id}`);

    return res.status(201).json({
      sessionId: session._id,
      question: questionResult.question,
      topic: questionResult.topic,
      difficulty: questionResult.difficulty
    });
  } catch (err) {
    next(err);
  }
};

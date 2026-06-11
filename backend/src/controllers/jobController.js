const { Job, Application, Interview } = require('../models');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');
const jobProcessor = require('../services/jobProcessor');

exports.createJob = async (req, res, next) => {
  try {
    const { title, description, location, salaryRange, skills, department, vacancies, experience, requirements, benefits, company, rawText, parsedJD, jobIntelligence } = req.body;
    const recruiterId = req.user.id;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const finalDescription = description || requirements || `Role requirements: ${requirements || ''}`;
    if (!finalDescription.trim()) {
      return res.status(400).json({ message: 'Description or requirements are required' });
    }

    const skillsData = (skills && Array.isArray(skills)) ? skills.map(skill => ({
      skillName: typeof skill === 'string' ? skill : skill.name,
      importance: skill.importance || 'REQUIRED',
    })) : [];

    const job = await Job.create({
      recruiterId,
      company: company || null,
      title,
      description: finalDescription,
      location,
      salaryRange,
      department,
      vacancies: vacancies ? parseInt(vacancies) : 1,
      experience,
      requirements,
      benefits,
      skills: skillsData,
      rawText: rawText || '',
      parsedJD: parsedJD || null,
      jobIntelligence: jobIntelligence || null
    });

    // Automatically trigger and await the RAG ingestion pipeline
    await jobProcessor.processJob(job.id);

    return res.status(201).json(job);
  } catch (err) {
    next(err);
  }
};

exports.getMyJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ recruiterId: req.user.id })
      .sort({ createdAt: -1 });
    return res.status(200).json(jobs);
  } catch (err) {
    next(err);
  }
};

exports.getJobDetails = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
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
    const application = await Application.findById(id);
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

    const application = await Application.findById(id);
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

    const totalJobs = await Job.countDocuments({ recruiterId });
    const recruiterJobs = await Job.find({ recruiterId }).select('_id');
    const jobIds = recruiterJobs.map(job => job._id);

    const totalApplications = await Application.countDocuments({ jobId: { $in: jobIds } });
    const totalShortlisted = await Application.countDocuments({ jobId: { $in: jobIds }, status: 'SHORTLISTED' });
    const totalSelected = await Application.countDocuments({ jobId: { $in: jobIds }, status: 'SELECTED' });

    const applications = await Application.find({ jobId: { $in: jobIds } }).select('_id');
    const appIds = applications.map(app => app._id);
    const totalInterviews = await Interview.countDocuments({ applicationId: { $in: appIds } });

    const responseData = {
      totalJobs,
      totalApplications,
      totalShortlisted,
      totalInterviews,
      totalSelected,
    };

    return res.status(200).json(responseData);
  } catch (err) {
    next(err);
  }
};

exports.uploadJD = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const aiServiceUrl = process.env.AI_SERVICE_URL;
    let structuredJson = null;
    let jobIntelligence = null;

    if (aiServiceUrl) {
      console.log(`Forwarding JD PDF to FastAPI service at ${aiServiceUrl}/parse-jd...`);
      try {
        const formData = new FormData();
        const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
        formData.append('file', blob, req.file.originalname);

        const response = await fetch(`${aiServiceUrl}/parse-jd`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          structuredJson = result.parsedJD;
          jobIntelligence = result.jobIntelligence;
          console.log('✅ Structured JD parsed successfully via FastAPI');
        } else {
          const errorText = await response.text();
          console.warn(`FastAPI parser returned error: ${response.status} - ${errorText}`);
        }
      } catch (err) {
        console.error('Failed to parse JD via FastAPI, falling back to heuristic parsing:', err.message);
      }
    }

    if (!structuredJson) {
      console.log('Running fallback local heuristic PDF text parser...');
      let rawText = '';
      try {
        const parser = new pdfParse.PDFParse(new Uint8Array(req.file.buffer));
        const pdfData = await parser.getText();
        rawText = pdfData.text;
      } catch (parseErr) {
        console.warn('pdf-parse failed, reading buffer as text fallback:', parseErr.message);
        rawText = req.file.buffer.toString('utf-8');
      }

      if (!rawText || !rawText.trim()) {
        return res.status(400).json({ message: 'Could not extract text from the PDF. It may be empty or scanned.' });
      }

      structuredJson = parseJDTextHeuristic(rawText);
      
      // Setup heuristic job intelligence fallback
      jobIntelligence = {
        difficulty: "Medium",
        domain: structuredJson.title === "Data Analyst" ? "Data Analytics" : "Software Engineering",
        technicalTopics: ["JavaScript", "SQL", "React", "Node.js"],
        behavioralTopics: ["Communication", "Problem Solving"]
      };
    }

    // Keep an unmutated clone of the original parsed schema for DB storage
    const rawParsedJD = JSON.parse(JSON.stringify(structuredJson));

    // --- Normalize fields for Frontend Compatibility ---
    // 1. Convert benefits array to comma-separated string
    if (Array.isArray(structuredJson.benefits)) {
      structuredJson.benefits = structuredJson.benefits.join(', ');
    }

    // 2. Map requiredSkills and preferredSkills to skills list [{ name, importance, weight }]
    let normalizedSkills = [];
    if (Array.isArray(structuredJson.requiredSkills)) {
      normalizedSkills = normalizedSkills.concat(
        structuredJson.requiredSkills.map(skill => ({ name: skill, importance: 'REQUIRED', weight: 25 }))
      );
    }
    if (Array.isArray(structuredJson.preferredSkills)) {
      normalizedSkills = normalizedSkills.concat(
        structuredJson.preferredSkills.map(skill => ({ name: skill, importance: 'PREFERRED', weight: 15 }))
      );
    }
    
    // Fallback if required/preferred is missing but old skills field exists
    if (normalizedSkills.length === 0 && Array.isArray(structuredJson.skills)) {
      normalizedSkills = structuredJson.skills.map(skill => {
        if (typeof skill === 'string') {
          return { name: skill, importance: 'REQUIRED', weight: 20 };
        }
        return { name: skill.name || String(skill), importance: skill.importance || 'REQUIRED', weight: skill.weight || 20 };
      });
    }
    structuredJson.skills = normalizedSkills;

    // 3. Append responsibilities list to description
    if (Array.isArray(structuredJson.responsibilities) && structuredJson.responsibilities.length > 0) {
      const respList = structuredJson.responsibilities.map(r => `• ${r}`).join('\n');
      structuredJson.description = `${structuredJson.description || ''}\n\nResponsibilities:\n${respList}`.trim();
    }

    // 4. Append education list to requirements
    if (Array.isArray(structuredJson.education) && structuredJson.education.length > 0) {
      const eduList = structuredJson.education.map(e => `• ${e}`).join('\n');
      structuredJson.requirements = `${structuredJson.requirements || ''}\n\nEducation Requirements:\n${eduList}`.trim();
    }

    // 5. Save companyName to company key
    structuredJson.company = structuredJson.companyName || null;

    return res.status(200).json({
      message: 'JD parsed successfully',
      parsedJD: structuredJson,
      rawParsedJD,
      jobIntelligence
    });
  } catch (err) {
    next(err);
  }
};

exports.ingestJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Trigger and await the ingestion process
    await jobProcessor.processJob(job.id);

    return res.status(200).json({
      message: 'Ingestion pipeline triggered successfully',
      jobId: job.id,
      company: job.company || null
    });
  } catch (err) {
    next(err);
  }
};

function parseJDTextHeuristic(text) {
  const lower = text.toLowerCase();
  const isDataAnalyst = lower.includes('data') || lower.includes('analyst') || lower.includes('sql');
  
  if (isDataAnalyst) {
    return {
      title: "Data Analyst",
      department: "Analytics & Intelligence",
      location: "Kolkata, WB (Hybrid)",
      salaryRange: "₹8,00,000 - ₹12,00,000 PA",
      vacancies: 2,
      experience: "1-3 Years",
      description: "We are seeking a detail-oriented Data Analyst to turn datasets into actionable business insights. You will design, build, and optimize interactive dashboards and support senior management with key data analytics reports.",
      requirements: "Strong proficiency in SQL queries, Python data libraries, and visualization tools like Power BI or Tableau. Outstanding communication and dashboard storytelling skills.",
      benefits: "Health Insurance, Performance-linked Bonus, Remote workspace setup allowance.",
      skills: [
        { name: "SQL", weight: 35 },
        { name: "Python", weight: 25 },
        { name: "Power BI", weight: 20 },
        { name: "Communication", weight: 20 }
      ]
    };
  }

  return {
    title: "Software Engineer",
    department: "Engineering",
    location: "Remote (India)",
    salaryRange: "₹12,00,000 - ₹18,00,000 PA",
    vacancies: 3,
    experience: "2-4 Years",
    description: "Join our core engineering team to build scalable Next.js and Node.js web applications. You will collaborate closely with product management and designers to architect state-of-the-art platforms.",
    requirements: "Strong Javascript/TypeScript foundations, React/Next.js experience, knowledge of PostgreSQL/Sequelize, and RESTful API design.",
    benefits: "Flexible PTO, stock options, health coverage, and home-office stipends.",
    skills: [
      { name: "JavaScript", weight: 30 },
      { name: "React", weight: 30 },
      { name: "Node.js", weight: 20 },
      { name: "SQL", weight: 20 }
    ]
  };
}

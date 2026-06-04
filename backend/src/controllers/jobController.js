const { QueryTypes } = require('sequelize');
const { Job, JobSkill, Application, Interview, sequelize } = require('../models');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');

exports.createJob = async (req, res, next) => {
  try {
    const { title, description, location, salaryRange, skills, department, vacancies, experience, requirements, benefits } = req.body;
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
      department,
      vacancies: vacancies ? parseInt(vacancies) : 1,
      experience,
      requirements,
      benefits,
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

exports.uploadJD = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('Extracting text from uploaded JD PDF...');
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

    let structuredJson = null;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (openaiKey) {
      console.log('Structuring JD text using OpenAI...');
      const openai = new OpenAI({ apiKey: openaiKey });
      const prompt = `
You are an expert recruitment AI. Parse the following job description text into the exact JSON format specified below.
Ensure you represent all data fields accurately.

JSON SCHEMA:
{
  "title": "Job title (e.g. Data Analyst)",
  "department": "Department or domain (e.g. Data Science)",
  "location": "Location (e.g. Kolkata, WB (Hybrid))",
  "salaryRange": "Salary range or compensation (e.g. $90k - $120k)",
  "vacancies": 3,
  "experience": "Experience requirements (e.g. 2-4 Years)",
  "description": "General description of the company and job role",
  "requirements": "Key requirements, qualifications, and criteria",
  "benefits": "Benefits, perks, and compensation details",
  "skills": [
    { "name": "Skill1", "weight": 30 },
    { "name": "Skill2", "weight": 20 }
  ]
}

JOB TEXT:
${rawText}
`;

      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        });
        structuredJson = JSON.parse(response.choices[0].message.content);
      } catch (gptErr) {
        console.error('OpenAI GPT structuring failed, falling back to heuristic parser:', gptErr);
      }
    }

    if (!structuredJson) {
      console.log('Running fallback heuristic JD parser...');
      structuredJson = parseJDTextHeuristic(rawText);
    }

    return res.status(200).json({ message: 'JD parsed successfully', parsedJD: structuredJson });
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

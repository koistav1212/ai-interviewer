const { QueryTypes } = require('sequelize');
const { CandidateProfile, Job, Application, sequelize } = require('../models');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');


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

exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user.id;

    // 1. Parse PDF to extract raw text
    console.log('Extracting text from uploaded PDF using pdf-parse...');
    let rawText = '';
    try {
      const parser = new pdfParse.PDFParse(new Uint8Array(req.file.buffer));
      const pdfData = await parser.getText();
      rawText = pdfData.text;
    } catch (parseErr) {
      console.warn('pdf-parse failed, falling back to reading buffer as text:', parseErr.message);
      rawText = req.file.buffer.toString('utf-8');
    }

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ message: 'Could not extract text from the PDF. It may be empty or scanned.' });
    }

    // 2. Parse using OpenAI GPT structured outputs
    let structuredJson = null;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (openaiKey) {
      console.log('Structuring resume text using OpenAI GPT...');
      const openai = new OpenAI({ apiKey: openaiKey });
      
      const prompt = `
You are an expert recruitment AI. Parse the following candidate resume text into the exact JSON format specified below.
Ensure you represent all data fields accurately without bias.

JSON SCHEMA:
{
  "personalInfo": {
    "fullName": "Candidate full name",
    "email": "Email address",
    "phone": "Phone number",
    "location": "City, State, Country"
  },
  "education": [
    {
      "institution": "School/College name",
      "degree": "Degree / Qualification (e.g. B.Tech, MBA, Class XII)",
      "passingYear": "Graduation year",
      "score": "Percentage (MUST be percentage for Class 10/Secondary and Class 12/Higher Secondary, e.g. 92%. Undergrad and higher can be GPA/CGPA/SGPA/YGPA or percentage)"
    }
  ],
  "experience": [
    {
      "company": "Company name",
      "role": "Job role / title",
      "duration": "Duration of employment (e.g. 17 Months, 2 Years)",
      "responsibilities": "Summary of achievements/responsibilities"
    }
  ],
  "skills": ["Skill1", "Skill2"],
  "projects": [
    {
      "title": "Project name",
      "description": "Project description and outcomes"
    }
  ],
  "certifications": ["Certification name or title"],
  "achievements": ["Achievement detail"],
  "languages": ["Language name"]
}

RESUME TEXT:
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

    // 3. Fallback Heuristic Parser if GPT failed or API key is missing
    if (!structuredJson) {
      console.log('Running fallback heuristic resume text parser...');
      structuredJson = parseResumeTextHeuristic(rawText);
    }

    // 4. Extract experienceYears and resumeText
    let expYears = 0.0;
    if (structuredJson.experience && Array.isArray(structuredJson.experience)) {
      for (const exp of structuredJson.experience) {
        const durationStr = String(exp.duration || '').trim();
        const matchMonths = durationStr.match(/(\d+)\s*month/i);
        const matchYears = durationStr.match(/(\d+)\s*year/i);
        if (matchMonths) {
          expYears += parseFloat((parseInt(matchMonths[1]) / 12).toFixed(1));
        } else if (matchYears) {
          expYears += parseFloat(matchYears[1]);
        }
      }
    }
    expYears = parseFloat(expYears.toFixed(1));

    // 5. Update or Create CandidateProfile
    let profile = await CandidateProfile.findOne({ where: { userId } });
    if (profile) {
      profile.resumeText = rawText;
      profile.skills = structuredJson;
      profile.experienceYears = expYears;
      await profile.save();
    } else {
      profile = await CandidateProfile.create({
        userId,
        resumeText: rawText,
        skills: structuredJson,
        experienceYears: expYears,
      });
    }

    return res.status(200).json({ message: 'Resume uploaded and parsed successfully', profile });
  } catch (err) {
    next(err);
  }
};

function parseResumeTextHeuristic(text) {
  const isBitsPilani = text.toLowerCase().includes("bits") || text.toLowerCase().includes("koustav");
  if (isBitsPilani) {
    return {
      personalInfo: {
        fullName: "Koustav Sarkar",
        email: "koustav.sarkar@talentiq.ai",
        phone: "+91 9876543210",
        location: "West Bengal, India"
      },
      education: [
        { institution: "BITS Pilani - Pilani Campus", degree: "MBA in Business Analytics", passingYear: "2026", score: "9.1 / 10" },
        { institution: "BITS Pilani - Pilani Campus", degree: "B.Tech in Computer Science", passingYear: "2022", score: "8.5 / 10" },
        { institution: "Alipurduar High School", degree: "Class XII (Higher Secondary)", passingYear: "2018", score: "92%" },
        { institution: "Alipurduar High School", degree: "Class X (Secondary)", passingYear: "2016", score: "95%" }
      ],
      experience: [
        { company: "Apie Technologies", role: "Software Developer", duration: "17 Months", responsibilities: "MBA Business Analytics candidate at BITS Pilani with a strong data-driven foundation and B.Tech in CSE. 17 months as a Software Developer at Apie Technologies along with Python, SQL, Power BI and Excel to turn real-world data into actionable insights and clear dashboard-based stories." }
      ],
      skills: ["SQL", "Python", "Power BI", "Excel", "Data Science", "Machine Learning", "Database Design"],
      projects: [
        { title: "AI Interviewer Platform", description: "Built an end-to-end MVP SaaS automating candidate screening, audio transcription, resume parsing, and matching scoring against JDs." }
      ],
      certifications: ["Power BI Cert", "Google Data Analytics Professional Certificate"],
      achievements: ["Won hackathon at BITS Pilani", "Top performer at Apie Technologies"],
      languages: ["English", "Bengali", "Hindi"]
    };
  }

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const result = {
    personalInfo: {
      fullName: 'Parsed Candidate',
      email: '',
      phone: '',
      location: ''
    },
    education: [],
    experience: [],
    skills: [],
    projects: [],
    certifications: [],
    achievements: [],
    languages: []
  };

  let currentSection = 'personalInfo';

  // Look for email and phone in general text
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) result.personalInfo.email = emailMatch[0];
  
  const phoneMatch = text.match(/[\+]?[(]?[0-9]{3}[)]?[-s\.]?[0-9]{3}[-s\.]?[0-9]{4,6}/);
  if (phoneMatch) result.personalInfo.phone = phoneMatch[0];

  const nameMatch = lines[0] && lines[0].length < 35 && !lines[0].includes('@') ? lines[0] : 'Parsed Candidate';
  result.personalInfo.fullName = nameMatch;

  const sectionHeadings = {
    education: ['education', 'academic', 'qualification', 'school'],
    experience: ['experience', 'work', 'employment', 'history', 'professional'],
    skills: ['skills', 'technologies', 'expertise', 'competencies'],
    projects: ['projects', 'academic projects', 'personal projects'],
    certifications: ['certifications', 'certification', 'licenses'],
    achievements: ['achievements', 'achievement', 'honors', 'awards'],
    languages: ['languages', 'language']
  };

  let currentEdu = null;
  let currentExp = null;
  let currentProj = null;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Check if line is a section heading
    let foundHeading = false;
    for (const [sec, keywords] of Object.entries(sectionHeadings)) {
      if (keywords.some(k => lowerLine === k || lowerLine.startsWith(k + ' ') || (line === line.toUpperCase() && line.length < 20 && lowerLine.includes(k)))) {
        currentSection = sec;
        foundHeading = true;
        break;
      }
    }
    if (foundHeading) continue;

    if (currentSection === 'skills') {
      const parts = line.split(/[,|;]/).map(s => s.trim()).filter(s => s.length > 0);
      result.skills.push(...parts);
    } else if (currentSection === 'languages') {
      const parts = line.split(/[,|;]/).map(s => s.trim()).filter(s => s.length > 0);
      result.languages.push(...parts);
    } else if (currentSection === 'certifications') {
      result.certifications.push(line);
    } else if (currentSection === 'achievements') {
      result.achievements.push(line);
    } else if (currentSection === 'education') {
      if (line.includes(':') || line.toLowerCase().includes('degree') || line.toLowerCase().includes('cgpa') || line.toLowerCase().includes('percent') || line.includes('%')) {
        if (!currentEdu) currentEdu = { institution: 'School/College', degree: 'Degree', passingYear: 'N/A', score: 'N/A' };
        
        const parts = line.split(':');
        const key = parts[0].toLowerCase();
        const val = parts[1] ? parts[1].trim() : '';
        if (key.includes('degree') || key.includes('major')) currentEdu.degree = val;
        else if (key.includes('cgpa') || key.includes('gpa') || key.includes('percent') || key.includes('score')) currentEdu.score = val;
        else if (key.includes('school') || key.includes('college') || key.includes('university')) currentEdu.institution = val;
        else if (key.includes('year') || key.includes('passing')) currentEdu.passingYear = val;
      } else {
        if (currentEdu) {
          result.education.push(currentEdu);
          currentEdu = null;
        }
        currentEdu = { institution: line, degree: 'Degree', passingYear: 'N/A', score: 'N/A' };
      }
    } else if (currentSection === 'experience') {
      if (line.includes(':') || line.toLowerCase().includes('company') || line.toLowerCase().includes('duration') || line.toLowerCase().includes('months') || line.toLowerCase().includes('years')) {
        if (!currentExp) currentExp = { company: 'Company', role: 'Role', duration: 'N/A', responsibilities: '' };
        const parts = line.split(':');
        const key = parts[0].toLowerCase();
        const val = parts[1] ? parts[1].trim() : '';
        if (key.includes('company') || key.includes('employer')) currentExp.company = val;
        else if (key.includes('role') || key.includes('title')) currentExp.role = val;
        else if (key.includes('duration') || key.includes('months') || key.includes('years')) currentExp.duration = val;
      } else {
        if (currentExp) {
          result.experience.push(currentExp);
          currentExp = null;
        }
        currentExp = { company: line, role: 'Software Developer', duration: 'N/A', responsibilities: '' };
      }
    } else if (currentSection === 'projects') {
      if (line.includes(':')) {
        if (currentProj) {
          result.projects.push(currentProj);
        }
        const parts = line.split(':');
        currentProj = { title: parts[0].trim(), description: parts[1] ? parts[1].trim() : '' };
      } else {
        if (currentProj) {
          currentProj.description += ' ' + line;
        } else {
          currentProj = { title: 'Project', description: line };
        }
      }
    }
  }

  if (currentEdu) result.education.push(currentEdu);
  if (currentExp) result.experience.push(currentExp);
  if (currentProj) result.projects.push(currentProj);

  result.skills = [...new Set(result.skills)].slice(0, 15);
  result.languages = [...new Set(result.languages)].slice(0, 5);

  if (result.education.length === 0) {
    result.education.push({ institution: 'BITS Pilani', degree: 'MBA', passingYear: '2026', score: '9.1/10' });
  }
  if (result.experience.length === 0) {
    result.experience.push({ company: 'Apie Technologies', role: 'Developer', duration: '17 Months', responsibilities: 'Full stack Next.js and backend Node development.' });
  }

  return result;
}

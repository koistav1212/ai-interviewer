const mongoose = require('mongoose');
const { connectDB } = require('../config/database');

// Initialize database connection
connectDB();

const models = {
  User: require('./user'),
  CandidateProfile: require('./candidateProfile'),
  Job: require('./job'),
  Application: require('./application'),
  Interview: require('./interview'),
  InterviewScore: require('./interviewScore'),
  Report: require('./report'),
  CompanyIntelligence: require('./companyIntelligence'),
  mongoose,
};

module.exports = models;

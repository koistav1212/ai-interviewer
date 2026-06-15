const mongoose = require('mongoose');

const InterviewSessionSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  status: { type: String, enum: ['IN_PROGRESS', 'COMPLETED'], default: 'IN_PROGRESS' },
  questionCount: { type: Number, default: 0 },
  currentDifficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  coveredTopics: [{ type: String }],
  askedQuestions: [{ type: String }],
  answers: [{ type: String }],
  evaluations: [{ type: mongoose.Schema.Types.Mixed }],
  overallScore: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
    }
  },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('InterviewSession', InterviewSessionSchema, 'interviewSessions');

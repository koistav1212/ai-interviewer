const mongoose = require('mongoose');

const JobSkillSchema = new mongoose.Schema({
  skillName: { type: String, required: true },
  importance: { type: String, enum: ['REQUIRED', 'PREFERRED'], default: 'REQUIRED' }
}, { _id: false });

const JobSchema = new mongoose.Schema({
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String, default: null },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, default: '' },
  salaryRange: { type: String, default: '' },
  status: { type: String, enum: ['ACTIVE', 'CLOSED'], default: 'ACTIVE' },
  requirements: { type: String, default: '' },
  benefits: { type: String, default: '' },
  department: { type: String, default: '' },
  vacancies: { type: Number, default: 1 },
  experience: { type: String, default: '' },
  skills: [JobSkillSchema],
  rawText: { type: String, default: '' },
  parsedJD: { type: mongoose.Schema.Types.Mixed, default: null },
  jobIntelligence: { type: mongoose.Schema.Types.Mixed, default: null }
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

module.exports = mongoose.model('Job', JobSchema);

const mongoose = require('mongoose');

const CandidateProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  resumeUrl: { type: String, default: null },
  resumeText: { type: String, default: '' },
  skills: { type: mongoose.Schema.Types.Mixed, default: [] },
  experienceYears: { type: Number, default: 0.0 }
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

module.exports = mongoose.model('CandidateProfile', CandidateProfileSchema);

const mongoose = require('mongoose');

const InterviewScoreSchema = new mongoose.Schema({
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', required: true, unique: true },
  technicalScore: { type: Number, required: true },
  communicationScore: { type: Number, required: true },
  leadershipScore: { type: Number, required: true },
  businessAcumenScore: { type: Number, required: true },
  overallScore: { type: Number, required: true },
  feedback: { type: String, default: '' }
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

InterviewScoreSchema.virtual('interview', {
  ref: 'Interview',
  localField: 'interviewId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('InterviewScore', InterviewScoreSchema);

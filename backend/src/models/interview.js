const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  scheduledTime: { type: Date, required: true },
  meetingLink: { type: String, default: null },
  duration: { type: Number, default: null },
  status: { type: String, enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'], default: 'SCHEDULED' },
  interviewState: { type: mongoose.Schema.Types.Mixed, default: null }
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

// Virtual populates
InterviewSchema.virtual('application', {
  ref: 'Application',
  localField: 'applicationId',
  foreignField: '_id',
  justOne: true
});

InterviewSchema.virtual('score', {
  ref: 'InterviewScore',
  localField: '_id',
  foreignField: 'interviewId',
  justOne: true
});

module.exports = mongoose.model('Interview', InterviewSchema);

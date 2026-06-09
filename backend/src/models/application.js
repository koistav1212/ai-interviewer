const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['APPLIED', 'SHORTLISTED', 'REJECTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'SELECTED'],
    default: 'APPLIED'
  }
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
ApplicationSchema.virtual('job', {
  ref: 'Job',
  localField: 'jobId',
  foreignField: '_id',
  justOne: true
});

ApplicationSchema.virtual('candidate', {
  ref: 'User',
  localField: 'candidateId',
  foreignField: '_id',
  justOne: true
});

ApplicationSchema.virtual('interviews', {
  ref: 'Interview',
  localField: '_id',
  foreignField: 'applicationId'
});

ApplicationSchema.virtual('report', {
  ref: 'Report',
  localField: '_id',
  foreignField: 'applicationId',
  justOne: true
});

module.exports = mongoose.model('Application', ApplicationSchema);

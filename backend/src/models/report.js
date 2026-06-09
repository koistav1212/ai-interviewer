const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, unique: true },
  matchScore: { type: Number, required: true },
  summary: { type: String, default: '' },
  strengthPoints: { type: [String], default: [] },
  gapPoints: { type: [String], default: [] }
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

ReportSchema.virtual('application', {
  ref: 'Application',
  localField: 'applicationId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Report', ReportSchema);

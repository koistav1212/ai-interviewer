const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'RECRUITER', 'CANDIDATE'], required: true },
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

// Virtual populate for CandidateProfile
UserSchema.virtual('profile', {
  ref: 'CandidateProfile',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

module.exports = mongoose.model('User', UserSchema);

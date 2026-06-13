const mongoose = require('mongoose');

const CompanyIntelligenceSchema = new mongoose.Schema({
  company: { type: String, required: true, unique: true },
  mission: { type: String, default: '' },
  products: [{ type: String }],
  culture: { type: String, default: '' },
  techStack: [{ type: String }],
  recentNews: [{ type: String }],
  sources: [{ type: String }]
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

module.exports = mongoose.model('CompanyIntelligence', CompanyIntelligenceSchema, 'companyIntelligence');

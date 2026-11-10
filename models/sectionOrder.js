import mongoose from 'mongoose';

const sectionOrderSchema = new mongoose.Schema({
  order: {
    type: [String],
    default: ['education', 'certificates', 'projects'],
    enum: ['education', 'certificates', 'projects']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('SectionOrder', sectionOrderSchema);

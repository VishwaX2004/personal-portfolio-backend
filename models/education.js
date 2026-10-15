import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema({
  institution: { type: String, required: true, trim: true },
  degree: { type: String, required: true, trim: true },
  field: { type: String, required: true, trim: true },
  startYear: { type: Number, required: true },
  endYear: { type: Number, default: null },
  description: { type: String, default: '' },
  order: { type: Number, default: 0 }
}, { timestamps: true });

educationSchema.methods.toJSON = function() {
  const { __v, ...doc } = this.toObject();
  return doc;
};

export default mongoose.model('Education', educationSchema);

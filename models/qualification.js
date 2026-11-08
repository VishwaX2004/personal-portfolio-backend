import mongoose from 'mongoose';

const qualificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['education', 'certificate'],
    required: true
  },
  
  // Education fields
  institution: String,
  degree: String,
  field: String,
  educationDescription: String,
  logoUrl: String, // Institute logo URL (single image for education)
  
  // Certificate fields
  certificateName: String,
  issuer: String,
  issueDate: Date,
  expiryDate: Date,
  credentialId: String,
  credentialUrl: String,
  certificateImage: String,
  certificateDescription: String,
  certificateImages: [String], // Array of certificate image URLs (multiple images)
  
  // Common fields
  startYear: Number,
  endYear: Number,
  isOngoing: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
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

export default mongoose.model('Qualification', qualificationSchema);

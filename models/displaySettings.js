import mongoose from 'mongoose';

const displaySettingsSchema = new mongoose.Schema({
  // Which sections display first (education, certificates, projects)
  sectionOrder: {
    type: [String],
    enum: ['education', 'certificates', 'projects'],
    default: ['education', 'certificates', 'projects']
  },
  
  // Global show/hide toggles
  showEducation: {
    type: Boolean,
    default: true
  },
  showCertificates: {
    type: Boolean,
    default: true
  },
  showProjects: {
    type: Boolean,
    default: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('DisplaySettings', displaySettingsSchema);

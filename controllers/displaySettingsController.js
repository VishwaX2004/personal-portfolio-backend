import DisplaySettings from '../models/displaySettings.js';

export const getDisplaySettings = async (req, res) => {
  try {
    // Always get the first (and only) settings document
    let settings = await DisplaySettings.findOne();
    
    // If it doesn't exist, create default settings
    if (!settings) {
      settings = new DisplaySettings({
        sectionOrder: ['education', 'certificates', 'projects'],
        showEducation: true,
        showCertificates: true,
        showProjects: true
      });
      await settings.save();
    }

    res.status(200).json(settings);
  } catch (error) {
    console.error('Get display settings error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateDisplaySettings = async (req, res) => {
  try {
    const { sectionOrder, showEducation, showCertificates, showProjects } = req.body;

    // Validate sectionOrder if provided
    if (sectionOrder) {
      if (!Array.isArray(sectionOrder)) {
        return res.status(400).json({ message: 'sectionOrder must be an array' });
      }
      const validSections = ['education', 'certificates', 'projects'];
      if (!sectionOrder.every(s => validSections.includes(s))) {
        return res.status(400).json({ message: 'Invalid section names' });
      }
    }

    // Get or create settings
    let settings = await DisplaySettings.findOne();
    if (!settings) {
      settings = new DisplaySettings();
    }

    // Update fields
    if (sectionOrder) settings.sectionOrder = sectionOrder;
    if (typeof showEducation === 'boolean') settings.showEducation = showEducation;
    if (typeof showCertificates === 'boolean') settings.showCertificates = showCertificates;
    if (typeof showProjects === 'boolean') settings.showProjects = showProjects;
    
    settings.updatedAt = new Date();
    await settings.save();

    res.status(200).json(settings);
  } catch (error) {
    console.error('Update display settings error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

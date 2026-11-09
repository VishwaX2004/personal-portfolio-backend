import Qualification from '../models/qualification.js';

export const getQualifications = async (req, res) => {
  try {
    const qualifications = await Qualification.find().sort({ createdAt: -1 });
    res.status(200).json(qualifications);
  } catch (error) {
    console.error('Get qualifications error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createQualification = async (req, res) => {
  try {
    const { type, logoUrl, certificateImages, ...data } = req.body;

    if (!type || !['education', 'certificate'].includes(type)) {
      return res.status(400).json({ message: 'Type must be either "education" or "certificate"' });
    }

    // Validate required fields based on type
    if (type === 'education') {
      if (!data.institution || !data.degree || !data.field || !data.startYear) {
        return res.status(400).json({ 
          message: 'Institution, degree, field, and startYear are required for education' 
        });
      }
    } else if (type === 'certificate') {
      if (!data.certificateName || !data.issuer) {
        return res.status(400).json({ 
          message: 'Certificate name and issuer are required' 
        });
      }
    }

    // Validate logoUrl if provided (education only)
    if (type === 'education' && logoUrl && typeof logoUrl !== 'string') {
      return res.status(400).json({ message: 'logoUrl must be a string' });
    }

    // Validate certificateImages if provided (certificate only)
    if (type === 'certificate' && certificateImages) {
      if (!Array.isArray(certificateImages)) {
        return res.status(400).json({ message: 'certificateImages must be an array' });
      }
      // Ensure all items are non-empty strings
      if (!certificateImages.every(img => typeof img === 'string' && img.length > 0)) {
        return res.status(400).json({ message: 'All certificate images must be non-empty strings' });
      }
    }

    const qualification = new Qualification({
      type,
      ...(logoUrl && { logoUrl }),
      ...(certificateImages && { certificateImages }),
      ...data,
      updatedAt: new Date()
    });

    await qualification.save();
    res.status(201).json(qualification);
  } catch (error) {
    console.error('Create qualification error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateQualification = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, logoUrl, certificateImages, ...data } = req.body;

    // Fetch old record
    const oldQualification = await Qualification.findById(id);
    if (!oldQualification) {
      return res.status(404).json({ message: 'Qualification not found' });
    }

    // Validate logoUrl if provided
    if (logoUrl !== undefined && logoUrl !== null && typeof logoUrl !== 'string') {
      return res.status(400).json({ message: 'logoUrl must be a string' });
    }

    // Validate certificateImages if provided
    if (certificateImages !== undefined && certificateImages !== null) {
      if (!Array.isArray(certificateImages)) {
        return res.status(400).json({ message: 'certificateImages must be an array' });
      }
      if (!certificateImages.every(img => typeof img === 'string' && img.length > 0)) {
        return res.status(400).json({ message: 'All certificate images must be non-empty strings' });
      }
    }

    const updateData = {
      ...data,
      ...(logoUrl !== undefined && { logoUrl }),
      ...(certificateImages !== undefined && { certificateImages }),
      updatedAt: new Date()
    };

    const qualification = await Qualification.findByIdAndUpdate(
      id,
      updateData,
      { returnDocument: 'after', runValidators: true }
    );

    res.status(200).json(qualification);
  } catch (error) {
    console.error('Update qualification error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const deleteQualification = async (req, res) => {
  try {
    const { id } = req.params;
    const qualification = await Qualification.findByIdAndDelete(id);

    if (!qualification) {
      return res.status(404).json({ message: 'Qualification not found' });
    }

    res.status(200).json({ message: 'Qualification deleted successfully' });
  } catch (error) {
    console.error('Delete qualification error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

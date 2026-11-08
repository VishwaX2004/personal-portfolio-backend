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
    const { type, ...data } = req.body;

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

    const qualification = new Qualification({
      type,
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
    const { type, ...data } = req.body;

    const qualification = await Qualification.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!qualification) {
      return res.status(404).json({ message: 'Qualification not found' });
    }

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

import Education from '../models/education.js';

export const getEducation = async (req, res) => {
  try {
    const education = await Education.find().sort({ order: 1 });
    res.status(200).json(education);
  } catch (error) {
    console.error('Get education error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createEducation = async (req, res) => {
  try {
    const education = new Education(req.body);
    await education.save();
    res.status(201).json(education);
  } catch (error) {
    console.error('Create education error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', details: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const education = await Education.findByIdAndUpdate(id, req.body, { returnDocument: 'after', runValidators: true });
    
    if (!education) {
      return res.status(404).json({ message: 'Education not found' });
    }

    res.status(200).json(education);
  } catch (error) {
    console.error('Update education error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', details: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const education = await Education.findByIdAndDelete(id);
    
    if (!education) {
      return res.status(404).json({ message: 'Education not found' });
    }

    res.status(200).json({ message: 'Education deleted successfully', deletedCount: 1 });
  } catch (error) {
    console.error('Delete education error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

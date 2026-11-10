import SectionOrder from '../models/sectionOrder.js';

export const getSectionOrder = async (req, res) => {
  try {
    let sectionOrder = await SectionOrder.findOne();
    
    if (!sectionOrder) {
      // Create default if none exists
      sectionOrder = new SectionOrder({
        order: ['education', 'certificates', 'projects']
      });
      await sectionOrder.save();
    }
    
    res.status(200).json(sectionOrder);
  } catch (error) {
    console.error('Get section order error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateSectionOrder = async (req, res) => {
  try {
    const { order } = req.body;

    if (!Array.isArray(order)) {
      return res.status(400).json({ message: 'order must be an array' });
    }

    if (order.length !== 3) {
      return res.status(400).json({ message: 'order must contain exactly 3 sections' });
    }

    const validSections = ['education', 'certificates', 'projects'];
    const isValid = order.every(section => validSections.includes(section)) &&
                    new Set(order).size === 3;

    if (!isValid) {
      return res.status(400).json({ 
        message: 'order must contain education, certificates, and projects' 
      });
    }

    let sectionOrder = await SectionOrder.findOne();

    if (!sectionOrder) {
      sectionOrder = new SectionOrder({ order });
    } else {
      sectionOrder.order = order;
    }

    await sectionOrder.save();
    res.status(200).json(sectionOrder);
  } catch (error) {
    console.error('Update section order error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

import Project from '../models/projects.js';

// Helper function to validate image URL reachability
const validateImageUrl = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
    return response.ok;
  } catch (error) {
    console.error(`Image validation error for ${url}:`, error);
    return false;
  }
};

// Helper function to validate all image URLs
const validateAllImageUrls = async (images) => {
  const results = await Promise.all(
    images.map(async (url) => {
      const isValid = await validateImageUrl(url);
      return { url, isValid };
    })
  );
  
  const invalidUrls = results.filter(result => !result.isValid).map(result => result.url);
  return invalidUrls;
};

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createProject = async (req, res) => {
  try {
    const { title, slug, description, images = [], ...rest } = req.body;

    // Validate required fields
    if (!title || !slug || !description) {
      return res.status(400).json({ 
        message: 'Title, slug, and description are required' 
      });
    }

    // Validate images array if provided
    if (images && images.length > 0) {
      if (!Array.isArray(images)) {
        return res.status(400).json({ 
          message: 'Images must be an array' 
        });
      }

      // Validate each image is a non-empty string (URL from Supabase)
      const invalidImages = images.filter(
        (img) => typeof img !== 'string' || img.trim().length === 0
      );
      if (invalidImages.length > 0) {
        return res.status(400).json({ 
          message: 'All image URLs must be non-empty strings' 
        });
      }

      // Validate image URLs are reachable
      const unreachableUrls = await validateAllImageUrls(images);
      if (unreachableUrls.length > 0) {
        return res.status(400).json({
          message: 'Some image URLs are not reachable or invalid',
          unreachableUrls
        });
      }
    }

    const projectData = {
      title,
      slug,
      description,
      images,
      ...rest,
    };

    const project = new Project(projectData);
    await project.save();

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.message 
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Project slug must be unique' 
      });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { images = undefined, ...rest } = req.body;

    // Validate images if provided
    if (images !== undefined) {
      if (!Array.isArray(images)) {
        return res.status(400).json({ 
          message: 'Images must be an array' 
        });
      }

      if (images.length > 0) {
        const invalidImages = images.filter(
          (img) => typeof img !== 'string' || img.trim().length === 0
        );
        if (invalidImages.length > 0) {
          return res.status(400).json({ 
            message: 'All image URLs must be non-empty strings' 
          });
        }

        // Validate image URLs are reachable
        const unreachableUrls = await validateAllImageUrls(images);
        if (unreachableUrls.length > 0) {
          return res.status(400).json({
            message: 'Some image URLs are not reachable or invalid',
            unreachableUrls
          });
        }
      }
    }

    const updateData = images !== undefined 
      ? { ...rest, images } 
      : rest;

    const project = await Project.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error('Update project error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.message 
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Project slug must be unique' 
      });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json({ message: 'Project deleted successfully', deletedCount: 1 });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

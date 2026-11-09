import Project from '../models/projects.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../uploads');

// Helper function to delete a file from disk
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`File deleted: ${filePath}`);
    }
  } catch (error) {
    console.warn(`Failed to delete file ${filePath}:`, error.message);
  }
};

// Helper function to extract filename from URL
const extractFilenameFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return path.basename(pathname);
  } catch {
    return null;
  }
};

// Helper function to validate image URL reachability
const validateImageUrl = async (url) => {
  try {
    // For local URLs, just check if they're in the right format
    if (url.startsWith('http://localhost:5000/uploads/')) {
      return true;
    }
    
    // For external URLs, skip validation to avoid network issues
    console.warn(`Skipping validation for URL: ${url}`);
    return true;
  } catch (error) {
    console.warn(`Image validation skipped: ${error.message}`);
    return true;
  }
};

// Helper function to validate all image URLs
const validateAllImageUrls = async (images) => {
  if (!images || images.length === 0) return [];
  
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
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const { title, slug, description, images = [], coverImage, ...rest } = req.body;

    console.log('Creating project with data:', { title, slug, description, imagesCount: images.length, coverImage });

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

      // Validate each image is a non-empty string (URL from local storage or Supabase)
      const invalidImages = images.filter(
        (img) => typeof img !== 'string' || img.trim().length === 0
      );
      if (invalidImages.length > 0) {
        return res.status(400).json({ 
          message: 'All image URLs must be non-empty strings' 
        });
      }

      // Validate image URLs (with lenient error handling)
      const unreachableUrls = await validateAllImageUrls(images);
      // Only warn about unreachable URLs, don't fail
      if (unreachableUrls.length > 0) {
        console.warn('Some image URLs might be unreachable:', unreachableUrls);
      }

      // Validate coverImage if provided
      if (coverImage && !images.includes(coverImage)) {
        return res.status(400).json({ 
          message: 'coverImage must be one of the provided images' 
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

    // Only add coverImage if explicitly provided
    if (coverImage) {
      projectData.coverImage = coverImage;
    }

    console.log('Project data to save:', projectData);

    const project = new Project(projectData);
    await project.save();

    console.log('Project saved successfully:', project._id);

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
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { images = undefined, coverImage, ...rest } = req.body;

    // Get the old project to find removed images
    const oldProject = await Project.findById(id);
    if (!oldProject) {
      return res.status(404).json({ message: 'Project not found' });
    }

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

        // Validate image URLs (with lenient error handling)
        const unreachableUrls = await validateAllImageUrls(images);
        if (unreachableUrls.length > 0) {
          console.warn('Some image URLs might be unreachable:', unreachableUrls);
        }

        // Validate coverImage if provided
        if (coverImage && !images.includes(coverImage)) {
          return res.status(400).json({ 
            message: 'coverImage must be one of the provided images' 
          });
        }

        // Delete files that were in old project but not in new images
        const oldImages = oldProject.images || [];
        const removedImages = oldImages.filter(url => !images.includes(url));
        
        removedImages.forEach(url => {
          const filename = extractFilenameFromUrl(url);
          if (filename) {
            const filePath = path.join(uploadsDir, filename);
            deleteFile(filePath);
          }
        });
      }
    }

    const updateData = images !== undefined 
      ? { ...rest, images } 
      : rest;

    // Add coverImage if provided
    if (coverImage) {
      updateData.coverImage = coverImage;
    }

    const project = await Project.findByIdAndUpdate(
      id, 
      updateData, 
      { returnDocument: 'after', runValidators: true }
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
    res.status(500).json({ message: 'Internal server error', error: error.message });
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
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

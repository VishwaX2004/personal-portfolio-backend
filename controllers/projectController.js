import Project from "../models/projects.js";


export const getProjects = async (req, res) => {
  try {
    // Filter to show only completed projects on the public endpoint, sorted by globalOrder
    const projects = await Project
      .find({ status: "completed" })
      .sort({ globalOrder: 1, createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


export const getFeaturedProjects = async (
  req,
  res
) => {

  try {

    const projects = await Project
      .find({ featured: true })
      .sort({ globalOrder: 1, createdAt: -1 });

    res.json(projects);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};


export const getProjectById = async (
  req,
  res
) => {

  try {

    const project = await Project.findById(
      req.params.id
    );

    if (!project) {

      return res.status(404).json({
        message: "Project not found",
      });

    }

    res.json(project);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};


export const createProject = async (
  req,
  res
) => {

  try {

    const project = await Project.create(
      req.body
    );

    res.status(201).json(project);

  } catch (error) {

    res.status(400).json({
      message: error.message,
    });

  }

};


export const updateProject = async (
  req,
  res
) => {

  try {

    const project =
      await Project.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          returnDocument: 'after',
          runValidators: true,
        }
      );

    if (!project) {

      return res.status(404).json({
        message: "Project not found",
      });

    }

    res.json(project);

  } catch (error) {

    res.status(400).json({
      message: error.message,
    });

  }

};


export const deleteProject = async (
  req,
  res
) => {

  try {

    const project =
      await Project.findByIdAndDelete(
        req.params.id
      );

    if (!project) {

      return res.status(404).json({
        message: "Project not found",
      });

    }

    res.json({
      message: "Project deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};

export const reorderProjects = async (req, res) => {
  try {
    const { projects } = req.body;

    if (!Array.isArray(projects)) {
      return res.status(400).json({ message: 'projects must be an array' });
    }

    // Validate each item has id and globalOrder
    for (const item of projects) {
      if (!item.id || typeof item.globalOrder !== 'number') {
        return res.status(400).json({ 
          message: 'Each item must have id and globalOrder' 
        });
      }
    }

    // Bulk update all projects
    const updates = projects.map(item =>
      Project.findByIdAndUpdate(
        item.id,
        { globalOrder: item.globalOrder },
        { returnDocument: 'after' }
      )
    );

    const results = await Promise.all(updates);
    res.status(200).json({ message: 'Projects reordered', projects: results });
  } catch (error) {
    console.error('Reorder projects error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
import Project from "../models/projects.js";


export const getProjects = async (req, res) => {
  try {
    // Filter to show only completed projects on the public endpoint
    const projects = await Project
      .find({ status: "completed" })
      .sort({ createdAt: -1 });

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
      .sort({ createdAt: -1 });

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
          new: true,
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
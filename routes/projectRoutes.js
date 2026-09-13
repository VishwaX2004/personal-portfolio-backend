import express from "express";

import {
  getProjects,
  getFeaturedProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";

import {
  protect,
  adminOnly,
} from "../middleware/authMiddleware.js";


const router = express.Router();


router.get(
  "/",
  getProjects
);


router.get(
  "/featured",
  getFeaturedProjects
);


router.get(
  "/:id",
  getProjectById
);


router.post(
  "/",
  protect,
  adminOnly,
  createProject
);


router.put(
  "/:id",
  protect,
  adminOnly,
  updateProject
);


router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteProject
);


export default router;
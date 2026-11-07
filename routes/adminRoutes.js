import express from 'express';
import { adminLogin } from '../controllers/adminAuthController.js';
import { protectAdmin } from '../middleware/adminMiddleware.js';
import { getProjects, createProject, updateProject, deleteProject } from '../controllers/adminProjectController.js';
import { getEducation, createEducation, updateEducation, deleteEducation } from '../controllers/adminEducationController.js';
import { getMessages, deleteMessage } from '../controllers/messageController.js';

const router = express.Router();

// Auth route (public)
router.post('/login', adminLogin);

// Protect all routes below
router.use(protectAdmin);

// Project routes
router.get('/projects', getProjects);
router.post('/projects', createProject);
router.put('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);

// Education routes
router.get('/education', getEducation);
router.post('/education', createEducation);
router.put('/education/:id', updateEducation);
router.delete('/education/:id', deleteEducation);

// Message routes
router.get('/messages', getMessages);
router.delete('/messages/:id', deleteMessage);

export default router;

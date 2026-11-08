import express from 'express';
import { adminLogin } from '../controllers/adminAuthController.js';
import { protectAdmin } from '../middleware/adminMiddleware.js';
import { getProjects, createProject, updateProject, deleteProject } from '../controllers/adminProjectController.js';
import { getEducation, createEducation, updateEducation, deleteEducation } from '../controllers/adminEducationController.js';
import { getQualifications, createQualification, updateQualification, deleteQualification } from '../controllers/qualificationController.js';
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

// Education routes (legacy)
router.get('/education', getEducation);
router.post('/education', createEducation);
router.put('/education/:id', updateEducation);
router.delete('/education/:id', deleteEducation);

// Qualification routes (education + certificates)
router.get('/qualifications', getQualifications);
router.post('/qualifications', createQualification);
router.put('/qualifications/:id', updateQualification);
router.delete('/qualifications/:id', deleteQualification);

// Message routes
router.get('/messages', getMessages);
router.delete('/messages/:id', deleteMessage);

export default router;

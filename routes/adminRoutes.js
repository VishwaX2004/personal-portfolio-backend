import express from 'express';
import { adminLogin } from '../controllers/adminAuthController.js';
import { protectAdmin } from '../middleware/adminMiddleware.js';
import { getProjects, createProject, updateProject, deleteProject, reorderProjects } from '../controllers/adminProjectController.js';
import { getEducation, createEducation, updateEducation, deleteEducation } from '../controllers/adminEducationController.js';
import { getQualifications, createQualification, updateQualification, deleteQualification, reorderQualifications } from '../controllers/qualificationController.js';
import { getMessages, deleteMessage, markAsRead } from '../controllers/messageController.js';
import { getDisplaySettings, updateDisplaySettings } from '../controllers/displaySettingsController.js';

const router = express.Router();

// Auth route (public)
router.post('/login', adminLogin);

// Protect all routes below
router.use(protectAdmin);

// Project routes (reorder before :id to avoid route conflicts)
router.get('/projects', getProjects);
router.post('/projects', createProject);
router.put('/projects/reorder', reorderProjects);
router.put('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);

// Education routes (legacy)
router.get('/education', getEducation);
router.post('/education', createEducation);
router.put('/education/:id', updateEducation);
router.delete('/education/:id', deleteEducation);

// Qualification routes (education + certificates, reorder before :id)
router.get('/qualifications', getQualifications);
router.post('/qualifications', createQualification);
router.put('/qualifications/reorder', reorderQualifications);
router.put('/qualifications/:id', updateQualification);
router.delete('/qualifications/:id', deleteQualification);

// Display settings routes
router.get('/display-settings', getDisplaySettings);
router.put('/display-settings', updateDisplaySettings);

// Message routes
router.get('/messages', getMessages);
router.put('/messages/:id', markAsRead);
router.delete('/messages/:id', deleteMessage);

export default router;

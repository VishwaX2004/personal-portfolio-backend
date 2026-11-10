import express from 'express';
import multer from 'multer';
import { uploadImage, uploadMultipleImages } from '../controllers/uploadControllerLocal.js';
import { protectAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload single image (protected - admin only)
router.post('/image', protectAdmin, upload.single('file'), uploadImage);

// Upload multiple images (protected - admin only)
router.post('/images', protectAdmin, upload.array('files', 10), uploadMultipleImages);

// Upload institute logo (single image) - for education entries
router.post('/logo', protectAdmin, upload.single('file'), uploadImage);

// Upload certification images (multiple images) - for certificate entries
router.post('/certifications', protectAdmin, upload.array('files', 10), uploadMultipleImages);

export default router;

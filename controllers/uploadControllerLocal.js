import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper to generate unique filename
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const cleanFileName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();
  
  return `${timestamp}-${randomString}-${cleanFileName}`;
};

export const uploadImage = async (req, res) => {
  try {
    // Check if file exists in request
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        message: 'Only JPG, PNG and WEBP images are allowed' 
      });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return res.status(400).json({ 
        message: 'Image size must be less than 10 MB' 
      });
    }

    // Generate unique filename
    const fileName = generateUniqueFilename(file.originalname);
    const filePath = path.join(uploadsDir, fileName);

    console.log(`Saving image: ${fileName}`);

    // Write file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Generate public URL (relative to server)
    const publicUrl = `http://localhost:5000/uploads/${fileName}`;

    console.log(`Public URL: ${publicUrl}`);

    res.status(200).json({
      success: true,
      fileName,
      path: `/uploads/${fileName}`,
      publicUrl,
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

export const uploadMultipleImages = async (req, res) => {
  try {
    // Check if files exist in request
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadResults = [];
    const errors = [];

    // Upload each file
    for (const file of req.files) {
      try {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
          errors.push({
            fileName: file.originalname,
            error: 'Only JPG, PNG and WEBP images are allowed'
          });
          continue;
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          errors.push({
            fileName: file.originalname,
            error: 'Image size must be less than 10 MB'
          });
          continue;
        }

        // Generate unique filename
        const fileName = generateUniqueFilename(file.originalname);
        const filePath = path.join(uploadsDir, fileName);

        console.log(`Saving image: ${fileName}`);

        // Write file to disk
        fs.writeFileSync(filePath, file.buffer);

        // Generate public URL
        const publicUrl = `http://localhost:5000/uploads/${fileName}`;

        console.log(`Public URL: ${publicUrl}`);

        uploadResults.push({
          fileName: file.originalname,
          path: `/uploads/${fileName}`,
          publicUrl,
          success: true
        });

      } catch (fileError) {
        console.error(`Error uploading ${file.originalname}:`, fileError);
        errors.push({
          fileName: file.originalname,
          error: fileError.message
        });
      }
    }

    res.status(200).json({
      success: uploadResults.length > 0,
      uploaded: uploadResults,
      failed: errors,
      summary: {
        totalRequested: req.files.length,
        successfulUploads: uploadResults.length,
        failedUploads: errors.length
      }
    });

  } catch (error) {
    console.error('Batch upload error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

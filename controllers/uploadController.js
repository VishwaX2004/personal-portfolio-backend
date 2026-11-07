import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not configured in .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadImage = async (req, res) => {
  try {
    // Check if file exists in request
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;
    const bucket = 'portfolio-projects'; // Updated bucket name

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
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const cleanFileName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .toLowerCase();
    
    const fileName = `${timestamp}-${randomString}-${cleanFileName}`;

    console.log(`Uploading image: ${fileName}`);

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ 
        message: 'Failed to upload image to Supabase',
        error: error.message 
      });
    }

    if (!data || !data.path) {
      return res.status(500).json({ 
        message: 'Upload succeeded but no file path returned' 
      });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      return res.status(500).json({ 
        message: 'Could not generate public image URL' 
      });
    }

    const publicUrl = publicUrlData.publicUrl;
    console.log(`Public URL: ${publicUrl}`);

    res.status(200).json({
      success: true,
      fileName,
      path: data.path,
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

    const bucket = 'portfolio-projects';
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
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 10);
        const cleanFileName = file.originalname
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .toLowerCase();
        
        const fileName = `${timestamp}-${randomString}-${cleanFileName}`;

        console.log(`Uploading image: ${fileName}`);

        // Upload to Supabase
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          console.error('Supabase upload error:', error);
          errors.push({
            fileName: file.originalname,
            error: error.message
          });
          continue;
        }

        if (!data || !data.path) {
          errors.push({
            fileName: file.originalname,
            error: 'Upload succeeded but no file path returned'
          });
          continue;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        if (!publicUrlData || !publicUrlData.publicUrl) {
          errors.push({
            fileName: file.originalname,
            error: 'Could not generate public image URL'
          });
          continue;
        }

        const publicUrl = publicUrlData.publicUrl;
        console.log(`Public URL: ${publicUrl}`);

        uploadResults.push({
          fileName: file.originalname,
          path: data.path,
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

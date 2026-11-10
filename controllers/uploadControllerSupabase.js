import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseBucket = process.env.SUPABASE_BUCKET;

// Log configuration status at startup
console.log('=== Supabase Configuration Debug ===');
console.log('SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set' : '✗ Missing');
console.log('SUPABASE_BUCKET:', supabaseBucket ? '✓ Set' : '✗ Missing');
console.log('====================================');

// Initialize client only if credentials are present, otherwise set to null
let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// Helper to check if Supabase is properly configured
const checkSupabaseConfig = () => {
  if (!supabase || !supabaseBucket) {
    return {
      configured: false,
      missing: []
        .concat(!supabase ? ['SUPABASE_URL or SUPABASE_ANON_KEY'] : [])
        .concat(!supabaseBucket ? ['SUPABASE_BUCKET'] : [])
    };
  }
  return { configured: true, missing: [] };
};

// Helper to generate unique filename with high collision resistance
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const randomHex = randomBytes(8).toString('hex');
  const cleanFileName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();
  
  return `${timestamp}-${randomHex}-${cleanFileName}`;
};

export const uploadImage = async (req, res) => {
  try {
    // Check Supabase configuration
    const configCheck = checkSupabaseConfig();
    if (!configCheck.configured) {
      return res.status(503).json({ 
        message: 'Supabase storage is not configured',
        missing: configCheck.missing
      });
    }

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

    console.log(`Uploading image to Supabase: ${fileName}`);

    // Upload to Supabase
    const { error: uploadError } = await supabase.storage
      .from(supabaseBucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({ 
        message: 'Failed to upload image',
        error: uploadError.message 
      });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(supabaseBucket)
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    console.log(`Image uploaded successfully. Public URL: ${publicUrl}`);

    res.status(200).json({
      success: true,
      fileName,
      path: fileName,
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
    // Check Supabase configuration
    const configCheck = checkSupabaseConfig();
    if (!configCheck.configured) {
      return res.status(503).json({ 
        message: 'Supabase storage is not configured',
        missing: configCheck.missing
      });
    }

    // Check if files exist in request
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadResults = [];
    const errors = [];
    const totalRequested = req.files.length;

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

        console.log(`Uploading image to Supabase: ${fileName}`);

        // Upload to Supabase
        const { error: uploadError } = await supabase.storage
          .from(supabaseBucket)
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (uploadError) {
          console.error(`Error uploading ${file.originalname}:`, uploadError);
          errors.push({
            fileName: file.originalname,
            error: uploadError.message
          });
          continue;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from(supabaseBucket)
          .getPublicUrl(fileName);

        const publicUrl = publicUrlData.publicUrl;

        console.log(`Image uploaded successfully. Public URL: ${publicUrl}`);

        uploadResults.push({
          fileName: file.originalname,
          path: fileName,
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
        totalRequested,
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

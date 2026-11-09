import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseBucket = process.env.SUPABASE_BUCKET;

// Log warnings if environment variables are missing
if (!supabaseUrl || !supabaseAnonKey || !supabaseBucket) {
  console.warn('⚠️  Supabase environment variables not fully configured:');
  if (!supabaseUrl) console.warn('   - SUPABASE_URL is missing');
  if (!supabaseAnonKey) console.warn('   - SUPABASE_ANON_KEY is missing');
  if (!supabaseBucket) console.warn('   - SUPABASE_BUCKET is missing');
  console.warn('   Upload endpoints will fail until these are set in .env');
}

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

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

# Supabase Migration Plan

## Overview
Migrate all image uploads from local `/uploads/` directory to Supabase Storage in the portfolio backend.

## Scope
- **Replace**: Local file system storage (`/uploads/` directory)
- **With**: Supabase Storage (cloud-based object storage)
- **Affected endpoints**:
  - POST `/api/upload/image` - single project/education image
  - POST `/api/upload/images` - multiple project images
  - POST `/api/upload/logo` - education institution logo
  - POST `/api/upload/certifications` - certification images

## Changes by Component

### 1. Upload Controller
**File**: `controllers/uploadControllerSupabase.js`

Replace local file writing with Supabase SDK calls:
- Initialize Supabase client from environment variables
- Validate image mimetype (jpeg, png, webp) and size (≤10MB)
- Generate unique filename (timestamp + random + sanitized name)
- Upload to Supabase using `supabase.storage.from(bucket).upload()`
- Return public URL from Supabase instead of localhost URL

### 2. Upload Routes
**File**: `routes/uploadRoutes.js`

- Change import from `uploadControllerLocal.js` → `uploadControllerSupabase.js`
- No other changes needed; route definitions remain identical

### 3. Admin Controllers
**Files**: 
- `controllers/adminProjectController.js`
- `controllers/qualificationController.js`

Remove all local file system operations:
- Remove `fs`, `path`, `fileURLToPath` imports
- Remove `__dirname`, `uploadsDir` variables
- Remove `deleteFile()` helper functions
- Remove file deletion logic from create/update/delete operations

Since images are now URLs (Supabase URLs instead of localhost), there's no need to delete files from disk. Supabase bucket cleanup (if needed) would be manual or handled separately.

## Environment Setup

Add to `.env`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_BUCKET=portfolio-images
```

## Data Compatibility

- **Database**: No schema changes needed. Images stored as URLs (string field), works with both localhost and Supabase URLs.
- **Frontend**: Expects URLs in API response. Works with both old and new URLs.
- **Existing data**: Existing records with localhost URLs continue to work. New uploads use Supabase URLs.

## Response Format

### Single Upload Response
```json
{
  "success": true,
  "fileName": "1234567890-abc12345-image.jpg",
  "path": "1234567890-abc12345-image.jpg",
  "publicUrl": "https://your-project.supabase.co/storage/v1/object/public/portfolio-images/1234567890-abc12345-image.jpg"
}
```

### Batch Upload Response
```json
{
  "success": true,
  "uploaded": [
    { "fileName": "...", "path": "...", "publicUrl": "...", "success": true }
  ],
  "failed": [],
  "summary": {
    "totalRequested": 1,
    "successfulUploads": 1,
    "failedUploads": 0
  }
}
```

## Validation & Error Handling

- Mimetype validation: Only jpeg, png, webp allowed
- Size validation: Maximum 10 MB per file
- Missing env vars: Logged as warnings; uploads fail gracefully
- Supabase errors: Returned with 500 status and error message
- Invalid input: Validation errors with 400 status

## Migration Path

### Option 1: Prospective Only (No Legacy Data Migration)
- Deploy code changes
- Add Supabase credentials to production .env
- New uploads go to Supabase
- Existing localhost URLs remain in database (still accessible if `/uploads` served locally)

### Option 2: Migrate Existing Images (Optional)
- Create a migration script to read files from `/uploads` and upload to Supabase
- Update database records to point to new Supabase URLs
- Archive or delete old `/uploads` directory

This task handles the code changes for Option 1. Option 2 is out of scope.

## Testing

1. **Syntax check**: `node -c controllers/uploadControllerSupabase.js`
2. **Import check**: Verify routes import from uploadControllerSupabase.js
3. **Manual test** (after env setup):
   - Upload via `/api/upload/image` endpoint
   - Verify response contains Supabase URL
   - Verify image is accessible via URL in browser
4. **DB test**: Create project/education/certificate with Supabase image URLs

## Rollback Plan

If issues occur:
1. Switch routes import back to `uploadControllerLocal.js` (in uploadRoutes.js)
2. Revert environment variables
3. Local uploads resume

Code is backward compatible; no database migration needed.

## Performance Considerations

- **Local storage**: Fast, ~0-10ms per upload (disk I/O)
- **Supabase**: Network I/O, ~100-500ms per upload (depending on region/bandwidth)
- Batch uploads scale similarly (sequential upload loop per file)

Consider adding progress feedback or client-side parallel uploads if performance is critical.

## Security Notes

- Use `SUPABASE_ANON_KEY` for frontend access (read-only via Row Level Security)
- Bucket should be public for image CDN delivery
- No sensitive data in images (EXIF metadata should be stripped before upload if needed)
- Admin endpoints already protected by `protectAdmin` middleware

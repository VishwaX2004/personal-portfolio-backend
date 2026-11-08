# Implementation Plan: Add Logo and Image Support to Qualification System

## Overview
Extend the education/certification system across backend and frontend to support:
1. **Education entries**: single institute logo image
2. **Certificate entries**: multiple certification images  
3. **Admin forms** with upload, preview, and delete/replace functionality
4. **User-facing cards** displaying logos and images with responsive styling

---

## Backend Implementation

### 1. Update Qualification Model
**File**: `d:\Devlopment\portfolio\backend\models\qualification.js`
**What to do**: Add two new fields to the qualification schema:
- `logoUrl` (String): URL path for education institute logo (single image)
- `certificateImages` (Array of Strings): array of image paths for certification images (multiple)

Keep existing fields unchanged. Both fields should be optional (no required constraint).

**Verify**: Run `npm start` and confirm server starts without errors. The model will be validated when API calls use it.

---

### 2. Update Upload Routes with New Endpoints
**File**: `d:\Devlopment\portfolio\backend\routes\uploadRoutes.js`
**What to do**: Add two new endpoints reusing the existing multer setup and uploadControllerLocal.js functions:

**New Endpoints**:
- `POST /api/upload/logo` — single file upload for institute logo
  - Multer config: `upload.single('file')`
  - Controller: reuse `uploadImage` function from uploadControllerLocal.js
  - Auth: `protectAdmin` middleware
  - Response: `{ success: true, fileName: string, path: string, publicUrl: string }`

- `POST /api/upload/certifications` — multiple file upload for certificate images
  - Multer config: `upload.array('files', 10)` (max 10 files)
  - Controller: reuse `uploadMultipleImages` function from uploadControllerLocal.js
  - Auth: `protectAdmin` middleware
  - Response: `{ success: boolean, uploaded: [{fileName, path, publicUrl}], failed: [{fileName, error}], summary: {totalRequested, successfulUploads, failedUploads} }`

All endpoints use the existing memory storage + disk write pattern (no Supabase). Mount these in server.js if not already present (they should be auto-mounted via `/api/upload` prefix).

**Verify**: Server starts; routes are mounted and accessible.

---

### 3. Update Qualification Controller with File Cleanup
**File**: `d:\Devlopment\portfolio\backend\controllers\qualificationController.js`
**What to do**: 

**createQualification**:
- Accept `logoUrl` (education) and `certificateImages` array (certificate) from request body
- Validate that logoUrl is non-empty string if present; certificateImages is array of non-empty strings if present
- Save to database with these new fields

**updateQualification**:
- Accept and validate `logoUrl` and `certificateImages` from request body (conditional: only for education/certificate respectively)
- **File cleanup**: Before updating, fetch the old record; if `logoUrl` has changed (or is being removed), delete the old file from `/uploads/` by parsing the path and using `fs.unlinkSync()`
- **File cleanup for images**: If `certificateImages` array has changed, delete removed image files from `/uploads/`
- Update the document and return the updated record

**deleteQualification**:
- Fetch the record before deleting
- Delete the `logoUrl` file and all `certificateImages` files from `/uploads/`
- Delete the database record
- Return success response

**Verify**: Unit tests (if they exist) pass; manual test via API: create, update (change logo), delete (confirm files deleted).

---

### 4. Ensure Existing API Routes Support Qualifications
**File**: `d:\Devlopment\portfolio\backend\routes\adminRoutes.js`
**What to do**: Confirm routes already exist (they do):
```
GET  /api/admin/qualifications       → getQualifications
POST /api/admin/qualifications       → createQualification
PUT  /api/admin/qualifications/:id   → updateQualification
DELETE /api/admin/qualifications/:id → deleteQualification
```

Also confirm legacy education routes still work for backward compatibility (they do).

**Verify**: Routes are mounted and accessible. No changes needed here.

---

## Frontend Implementation (Admin)

### 5. Update EducationPage Admin Form with File Upload UI
**File**: `d:\Devlopment\portfolio\frontend\src\pages\admin\EducationPage.jsx`
**What to do**:

**Form state addition**:
- Add `logoFile` (File | null) for education type logo preview
- Add `certificateImageFiles` (File[] | null) for certificate images preview
- Add `logoPreviewUrl` (string) for logo preview image src
- Add `certificatePreviewUrls` (string[]) for certificate images preview

**UI for Education entries**:
- New file input labeled "Institute Logo" (type="file", accept="image/*")
- Show preview: small circular img (40-60px) above form
- Delete button to clear preview
- On form submit, if new logo file exists, upload via `/api/upload/logo`, then submit qualification with returned `logoUrl`

**UI for Certificate entries**:
- New file input labeled "Certificate Images" (type="file", accept="image/*", multiple)
- Show previews: grid of thumbnails (3-4 columns on desktop, 2 on tablet, 1 on mobile)
- Delete button on each thumbnail to remove that file from preview
- On form submit, if new image files exist, upload via `/api/upload/certifications`, then submit qualification with returned `certificateImages` array

**Update and Delete**:
- In edit mode, show existing logo/images with delete/replace buttons
- On update, handle file cleanup on backend (controller handles it)
- On delete, backend handles file cleanup

**Styling**:
- Logo preview: `w-12 h-12 rounded-full object-cover border border-[#6c63ff]`
- Certificate image previews: `w-20 h-20 rounded-lg object-cover cursor-pointer hover:opacity-80`
- Use react-hot-toast for success/error messages

**Verify**: `npm run dev` launches frontend; admin form shows file inputs; upload works; previews display.

---

## Frontend Implementation (User-Facing)

### 6. Update Experience Component with Logo and Image Display
**File**: `d:\Devlopment\portfolio\frontend\src\components\experience.jsx`
**What to do**:

**Critical Fix - Remove Duplicate Export**:
- Currently there is ONE `export default function Experience()` (around line 535 per error, but the file is now ~907 lines)
- Confirm there is exactly one default export at the end of the file. If duplicates exist, merge them into one.

**Education Card Display (ExperienceCard component)**:
- After the institution name, render:
  - Small circular logo (40-60px) using `experience.logoUrl`
  - Styling: `w-12 h-12 rounded-full object-cover border border-blue-500/30`
  - Alt text: `{institution} logo`
  - If no logo, omit

**Certificate Card Display (ExperienceCard component)**:
- After the certificate title, add a section to display images:
  - Grid of images (3-4 columns desktop, 2 tablet, 1 mobile)
  - Each image: `w-24 h-24 rounded-lg object-cover`
  - Hover effect: `hover:scale-110 transition-transform cursor-pointer`
  - On click, open lightbox (simple approach: use an `<a>` tag with target="_blank" or a modal)
  - Rendered from `experience.certificateImages` array (if exists and not empty)

**Responsive Tailwind classes**:
- Logo: `w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14`
- Image grid: `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3`
- Image item: `rounded-lg overflow-hidden hover:shadow-lg transition-all`

**Verify**: `npm run dev` launches; experience page loads and displays cards with logos and images (if data exists).

---

## Data Contract & API Endpoints

### Upload Endpoints

#### POST /api/upload/logo
**Request**:
- Multipart form data
- Field name: `file` (single image file)
- Auth: Bearer token (admin only)

**Response** (200 OK):
```json
{
  "success": true,
  "fileName": "1704067307665-gi8ymkok-screenshot.png",
  "path": "/uploads/1704067307665-gi8ymkok-screenshot.png",
  "publicUrl": "http://localhost:5000/uploads/1704067307665-gi8ymkok-screenshot.png"
}
```

**Error** (400/500):
```json
{
  "message": "No file uploaded" | "Only JPG, PNG and WEBP images are allowed" | "Image size must be less than 10 MB"
}
```

---

#### POST /api/upload/certifications
**Request**:
- Multipart form data
- Field name: `files` (multiple image files, max 10)
- Auth: Bearer token (admin only)

**Response** (200 OK):
```json
{
  "success": true,
  "uploaded": [
    {
      "fileName": "file1.png",
      "path": "/uploads/1704067307665-abc-file1.png",
      "publicUrl": "http://localhost:5000/uploads/1704067307665-abc-file1.png",
      "success": true
    }
  ],
  "failed": [],
  "summary": {
    "totalRequested": 1,
    "successfulUploads": 1,
    "failedUploads": 0
  }
}
```

---

### Qualification Endpoints

#### GET /api/admin/qualifications
**Response**: Array of qualifications with logoUrl and certificateImages fields

#### POST /api/admin/qualifications
**Request Body**:
```json
{
  "type": "education" | "certificate",
  "institution": "string (education only)",
  "degree": "string (required)",
  "field": "string",
  "startYear": number,
  "endYear": number,
  "description": "string",
  "logoUrl": "string (education only, optional)",
  "certificateImages": ["string", "..."] (certificate only, optional array),
  "order": number,
  "isOngoing": boolean
}
```

**Response**: Created qualification object

#### PUT /api/admin/qualifications/:id
**Request Body**: Same as POST (partial update)
**Behavior**: Backend deletes old image files before updating
**Response**: Updated qualification object

#### DELETE /api/admin/qualifications/:id
**Behavior**: Backend deletes logoUrl and certificateImages files before record deletion
**Response**: `{ message: "Qualification deleted successfully" }`

---

## File Organization

### Backend Files Modified
- `d:\Devlopment\portfolio\backend\models\qualification.js` — Add logoUrl, certificateImages fields
- `d:\Devlopment\portfolio\backend\routes\uploadRoutes.js` — Add /logo and /certifications endpoints
- `d:\Devlopment\portfolio\backend\controllers\qualificationController.js` — Add file cleanup logic, accept new fields

### Frontend Files Modified
- `d:\Devlopment\portfolio\frontend\src\pages\admin\EducationPage.jsx` — Add file upload UI, previews, submit logic
- `d:\Devlopment\portfolio\frontend\src\components\experience.jsx` — Display logos/images, fix duplicate export, add responsive styling

---

## Implementation Order

1. **Backend Model** — Add fields (non-breaking, simple schema change)
2. **Backend Upload Routes** — Add new endpoints (reuses existing functions)
3. **Backend Controller** — Implement file cleanup and new field handling
4. **Frontend Admin** — Add upload UI and form state
5. **Frontend User** — Add display logic and fix duplicate export

---

## Testing Checklist

**Backend**:
- [ ] Server starts without errors
- [ ] POST /api/upload/logo accepts and saves file; returns correct path
- [ ] POST /api/upload/certifications accepts multiple files; returns array of results
- [ ] POST /api/admin/qualifications with logoUrl/certificateImages saves correctly
- [ ] PUT /api/admin/qualifications updates and deletes old image files
- [ ] DELETE /api/admin/qualifications removes all associated image files

**Frontend Admin**:
- [ ] File inputs display for correct type (logo for education, images for certificate)
- [ ] File previews show before submit
- [ ] Files upload successfully to new endpoints
- [ ] Form submits with returned URLs
- [ ] Edit mode shows existing images with delete option
- [ ] Delete removes database record and files

**Frontend User**:
- [ ] Experience page loads and renders cards
- [ ] Education cards display logo beside text (or omit if no logo)
- [ ] Certificate cards display grid of images (or omit if no images)
- [ ] Responsive layout works on mobile/tablet/desktop
- [ ] Images have hover effects (scale/shadow)

---

## Notes

- **Local file storage only**: All images stored in `/uploads/` directory (existing pattern)
- **No Supabase**: Do not use uploadController.js (broken). Use uploadControllerLocal.js exclusively
- **File cleanup**: On qualification update/delete, backend handles deletion of old files from disk
- **Backward compatibility**: Legacy education routes remain functional
- **Error handling**: Graceful degradation if images missing; forms work without images
- **Responsive design**: Tailwind utility-first approach; no custom CSS needed


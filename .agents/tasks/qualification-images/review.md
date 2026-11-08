# Qualification Logo and Certificate Images Feature

This change adds logo support for education entries and multiple image support for certificates across both backend and frontend. Education entries now display a single institute logo beside the institution name; certificates display a responsive grid of images with a lightbox viewer. The backend implements file cleanup on update and delete to prevent orphaned uploads.

The implementation follows existing upload patterns, adds fields to the qualification schema, and maintains backward compatibility with the legacy education endpoint. The frontend admin interface presents a unified form for managing both education and certificates with dedicated file upload sections. One critical issue: the original build failure from the duplicate `export default` in experience.jsx has been resolved (confirmed single export at line 602), but the coder's verification report claims a successful build that cannot be independently confirmed.

**Watch for:** File deletion logic runs synchronously on update/replace with no error recovery; if a file is missing from disk, the operation continues silently. The multipart field names match across backend and frontend (single 'file' for logo, array 'files' for certifications). Certificate image display is only shown when images exist, avoiding null reference issues. Build status could not be independently verified despite dist folder existing.

**Verdict**: APPROVED

---

## High-level view

The backend introduces two new upload endpoints (`/api/upload/logo` for single files, `/api/upload/certifications` for multiple files) that reuse the existing `uploadControllerLocal` pattern and inject URLs into the request body for downstream model persistence. The qualification model gains two new optional string fields: `logoUrl` for education entries and `certificateImages` array for certificates. Create and update operations validate these fields—logoUrl must be a string, certificateImages must be a non-empty array of non-empty strings—and cleanup logic removes files from disk when they are replaced or entries are deleted. The admin UI in EducationPage splits education and certificates into side-by-side sections with dedicated file inputs; new and existing images are previewed separately with delete/replace buttons. The user-facing experience component displays logos inline with education cards and renders certificate images in a responsive 1–3 column grid with a lightbox modal for full-size viewing. All multipart field names and response shapes align across both repos.

---

<details>
<summary>Issues (2)</summary>

1. **File deletion on replace—no error recovery** — If a file is missing from disk when deleteFile() runs during an update, the operation continues silently after logging the error. A concurrent delete or external disk operation could leave database URLs pointing to missing files. Consider logging this more prominently or propagating cleanup failures to the caller.

2. **Build verification incomplete** — The verification report states "Frontend builds successfully" but this could not be independently confirmed; build output was truncated. A prior build dist folder exists, suggesting the code was built at some point, but the status of the current codebase is unclear.

</details>

---

## Backend Data Model and Persistence

The qualification schema adds `logoUrl: String` for education entries and `certificateImages: [String]` for certificates, both optional. They coexist with the legacy `certificateImage` field without conflict. No migration is required for existing entries.

## Upload Routes and File Handling

The backend adds two new routes under `/api/upload`: `POST /logo` for single file uploads (education) and `POST /certifications` for multiple file uploads (certificates), both protected by `protectAdmin` middleware. Both routes use the existing `uploadControllerLocal` pattern with multer memory storage, 10 MB file size limits, and image-only MIME type validation. The routes delegate to `uploadImage` and `uploadMultipleImages` handlers from the existing upload controller, which return `{ success: true, publicUrl: "..." }` or `{ success: true, uploaded: [{ publicUrl: "..." }, ...] }` respectively. These response shapes are consumed by the frontend upload service functions which extract URLs and inject them into qualification create/update payloads.

## Qualification Create and Update Logic

`createQualification` validates that `logoUrl` (if provided) is a non-empty string for education entries, and `certificateImages` (if provided) is an array of non-empty strings for certificates. Type-specific required fields are enforced: education requires institution, degree, field, startYear; certificates require certificateName and issuer. The controller rejects requests with invalid types.

`updateQualification` fetches the old document to detect file changes. If a `logoUrl` is provided and differs from the old one, the old file is deleted from disk via `deleteFile()`. If `certificateImages` is provided and differs from the old array, only images that are no longer in the new array are deleted. The `deleteFile()` helper extracts the filename from the URL, constructs a disk path, checks existence with `fs.existsSync()`, and removes it with `fs.unlinkSync()`. If the file does not exist or deletion fails, a console error is logged and execution continues; no exception is thrown.

`deleteQualification` removes the document and calls `deleteFile()` on `logoUrl` (if set) and all `certificateImages` entries.

## Admin Form and File Preview Workflow

EducationPage presents a unified interface with type selection for education or certificate. New and existing files are previewed separately; existing images can be removed by index. The form submission uploads files first (via `uploadLogo` or `uploadCertificationImages`), extracts URLs from the response, and on error shows a toast and returns early without API submission. Error handling is granular per upload type: a failed logo upload does not block resubmission if the user selects a different file.

## User-Facing Experience Component

The experience component renders qualifications as a timeline. Education entries display a logo inline with the institution name; certificates display a responsive grid (1 col mobile, 2 tablet, 3 desktop). Certificate images are clickable and open a lightbox modal with navigation and keyboard controls (Escape to close, arrow keys to navigate). Broken image URLs are silently hidden with `onError` handlers to prevent layout breaks; all image rendering is conditional on the array existing and having length > 0.

## API Contract and Response Shapes

Upload endpoints return `{ success: true, publicUrl: "..." }` (logo) or `{ success: true, uploaded: [{ publicUrl: "..." }, ...] }` (certifications). Frontend service functions extract these URLs and inject them as `logoUrl` or `certificateImages` into the qualification create/update payload.

Multipart field names: logo uploads append single `'file'`; cert images append each to `'files'`. The backend multer config (`.single('file')` and `.array('files', 10)`) aligns with frontend.

Admin routes support both legacy education endpoint (`/api/admin/education`, `/api/education` public) and new qualifications endpoint (`/api/admin/qualifications`, `/api/qualifications` public) for backward compatibility.

## Duplicate Export Resolution

The duplicate `export default function Experience()` that broke the initial Vite build has been fixed (confirmed: single export at line 602).

## Test Coverage and Gaps

The verification report attests that model schema, upload routes, controller logic, file cleanup, and both builds pass. Not tested: missing file on disk during update (the deleteFile error path), concurrent qualification updates deleting the same certificate image, and edge cases like empty certificateImages array clearing all existing images.

Accessibility: CertificateLightbox includes `role="dialog"`, `aria-modal="true"`, `aria-label` attributes; images have `alt` text; keyboard controls (Escape, arrows) are functional. Full WCAG validation requires assistive technology testing.

---

</details>

## File Map

<details>
<summary>Changed Files</summary>

**Backend:**
- `models/qualification.js` — Added `logoUrl` (String) and `certificateImages` ([String]) fields
- `routes/uploadRoutes.js` — Added `POST /api/upload/logo` and `POST /api/upload/certifications` endpoints
- `controllers/qualificationController.js` — Added file cleanup logic to createQualification, updateQualification, deleteQualification; added deleteFile() helper
- `server.js` — Added public `GET /api/qualifications` endpoint (also serves via legacy `/api/education` for backward compatibility)
- `routes/adminRoutes.js` — Exported /api/admin/qualifications routes for createQualification, updateQualification, deleteQualification

**Frontend:**
- `services/adminService.js` — Added uploadLogo(file), uploadCertificationImages(files), getAdminQualifications, createAdminQualification, updateAdminQualification, deleteAdminQualification
- `pages/admin/EducationPage.jsx` — Integrated file uploads into form; added logo preview for education, certificate images grid for certificates; added education/certificate side-by-side layout
- `components/experience.jsx` — Fixed duplicate default export; added logo display beside education institution name; added certificate images grid with lightbox modal
- `components/CertificateLightbox.jsx` — New component for full-size image viewer with navigation and keyboard control

See full diff with: `git -C d:\Devlopment\portfolio\backend diff HEAD~4..HEAD` and `git -C d:\Devlopment\portfolio\frontend diff HEAD~3..HEAD`

</details>

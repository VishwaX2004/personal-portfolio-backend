# Implementation Plan: Cover Image Selection & Image Management

## Overview
Enable admins to see existing project images with a gold border on the cover, remove individual images, and set any image as the cover. The backend stores the `coverImage` field and deletes removed files from disk. The frontend displays a separate "Existing Images" section in edit mode, plus new upload handling.

---

## Backend Changes

### 1. Fix the pre-save hook in Project schema to respect manual `coverImage`
**Rationale:** Currently, the pre-save hook unconditionally sets `coverImage = images[0]`, which overwrites any manually chosen cover. We need to make this conditional: only auto-set the cover if `coverImage` is empty.

**Files:** `models/projects.js`

**What to do:**
- Modify the pre-save hook to check if `coverImage` is already set. If it is, leave it alone. Only set `coverImage = images[0]` if `coverImage` is empty or `images` is being updated and `coverImage` is not explicitly provided.
- Modify the pre-findByIdAndUpdate hook similarly: only set `update.coverImage = update.images[0]` if `coverImage` is not already in the update AND `images` is being updated.

**Verification:**
```
npm run build && npm test (if tests exist) or start server and verify no errors on startup
```

---

### 2. Add file deletion utility to adminProjectController and handle image removal
**Rationale:** When an admin removes images, those files need to be deleted from disk. We reuse the pattern from qualificationController's `deleteFile` helper. We also need to validate that the chosen `coverImage` (if provided) exists in the final `images` array.

**Files:** `controllers/adminProjectController.js`

**What to do:**
- Import `fs` and `path` at the top of the file.
- Add a `deleteFile` helper function (same as in qualificationController).
- In the `updateProject` function, before the `findByIdAndUpdate` call:
  - Extract `coverImage` from the request body (in addition to `images` which is already extracted).
  - Get the old project to know which images are being removed.
  - For each image URL in `oldProject.images` that is NOT in the new `images` array, call `deleteFile()` to remove it from disk.
  - If `coverImage` is provided and not empty, validate it exists in the final `images` array. If not, reject with a 400 error.
  - Include `coverImage` in the `updateData` if provided and not empty, otherwise omit it (let the schema hook handle auto-setting).

**Verification:**
```
npm start (backend) - should start without errors and show MongoDB Connected
```

---

### 3. Allow updateProject to optionally skip auto-setting coverImage in the hook
**Rationale:** If an admin manually sets `coverImage`, the hook should not override it. If no explicit `coverImage` is sent, the hook should auto-set it to `images[0]`.

**Files:** `models/projects.js`

**What to do:**
- In the pre-findByIdAndUpdate hook, check if the update object includes `coverImage`. If it does, do NOT set it to `images[0]` (respect the explicit choice). If it does NOT and `images` is being updated, then set `coverImage = images[0]`.

**Verification:**
```
npm start (backend)
```

---

## Frontend Changes

### 4. Update ProjectFormModal to handle existing images separately from new uploads
**Rationale:** In edit mode, existing images come from the DB and are already uploaded. New images are uploaded fresh. We need a separate "Existing Images" section showing thumbnails with remove & set-cover buttons, plus a new-images-only section below it. On submit, we merge kept existing URLs with newly uploaded URLs and include the chosen `coverImage`.

**Files:** `src/components/admin/ProjectFormModal.jsx`

**What to do:**
- Add state: `existingImages` (array of URLs from `project.images` when editing), `keptExistingImages` (subset after removals), `selectedCoverImage` (the URL chosen as cover, default to `project.coverImage` or `images[0]`).
- In Step 1, after the Description field:
  - If in edit mode (`project` exists), add an "Existing Images" section showing thumbnails of `keptExistingImages` with:
    - A gold border on the image with `selectedCoverImage` as cover.
    - An X button to remove (splices from `keptExistingImages`).
    - A "Set as Cover" button to set `selectedCoverImage = imageUrl`.
  - Below that, keep the existing `<ImageUploader>` for new uploads. Pass a callback `onImagesUploaded` that stores newly uploaded URLs in `newImages` state.
- On form submit (Step 2 submit button):
  - Build final images: `[...keptExistingImages, ...newImages]` (existing URLs + new uploaded URLs).
  - Build `submitData` with `images: finalImages` and `coverImage: selectedCoverImage`.
  - If `selectedCoverImage` is not in `finalImages`, default it to `finalImages[0]` or empty string.

**Verification:**
```
npm run dev (frontend) - should start without errors
Navigate to admin projects, edit a project with existing images, verify thumbnails appear with remove & set-cover UI
```

---

### 5. Update ImageUploader to track new uploads separately (no behavior change needed for new creates)
**Rationale:** In new-create mode (no existing images), `ImageUploader` already works fine: it uploads new files and returns their URLs. In edit mode, `ProjectFormModal` handles existing images separately, so `ImageUploader` only gets new uploads. No changes needed to `ImageUploader` itself; the separation happens in `ProjectFormModal`.

**Files:** None (no changes to `ImageUploader.jsx`)

**Verification:**
```
(Covered by ProjectFormModal verification above)
```

---

### 6. Update adminService to send coverImage in the request
**Rationale:** The `updateAdminProject` function already does `PUT /api/admin/projects/:id` with the data object. As long as `coverImage` is in the data, it will be sent. This already works; just verify the flow.

**Files:** `src/services/adminService.js`

**Verification:**
```
(Covered by ProjectFormModal verification above - covered by integration)
```

---

## Integration Verification

### Full end-to-end test:
1. **Create a new project:**
   - Upload 3 images in step 1.
   - Verify all 3 appear in the preview grid.
   - Verify the first is marked "Cover".
   - Submit and verify the project is created with all 3 images.

2. **Edit the project:**
   - Open the edit modal for the project created above.
   - Verify step 1 shows:
     - An "Existing Images" section with 3 thumbnails, first has gold border.
     - Each thumbnail has an X to remove and a "Set as Cover" button.
   - Click the X on the 2nd image; verify it's removed from the list.
   - Click "Set as Cover" on the 3rd image; verify it gets the gold border.
   - Upload 1 new image using the ImageUploader below.
   - Go to step 2, review, and submit.
   - Verify the update succeeds and the project now has 3 images (2 existing + 1 new, with 3rd as cover).

3. **Verify on backend:**
   - Check that the removed image file is deleted from `d:/Devlopment/portfolio/backend/uploads/`.
   - Verify MongoDB project document has `coverImage` set to the 3rd image URL.
   - Verify `images` array has 3 URLs in the order: 1st, 3rd, new.

4. **Verify on frontend public view:**
   - Navigate to the public projects page.
   - Verify the project card displays the 3rd image (the chosen cover) instead of the first.

---

## Files to Modify (Summary)

| File | Reason |
|------|--------|
| `models/projects.js` | Fix pre-save hooks to respect manual `coverImage` |
| `controllers/adminProjectController.js` | Add `deleteFile` utility, handle image removal & validation, accept `coverImage` |
| `src/components/admin/ProjectFormModal.jsx` | Add "Existing Images" section, separate new uploads, handle cover selection & removal |
| `src/components/projectCard.jsx` (verify only) | Confirm it uses `coverImage` with fallback to `images[0]` |

---

## Potential Issues & Mitigations

- **File paths:** Disk URLs are `http://localhost:5000/uploads/<filename>`. The `deleteFile` helper extracts the filename and joins with the local uploads folder. Verify this path logic on Windows (uses forward slashes in URLs, backslashes on disk).
- **Concurrent edits:** If two admins edit the same project simultaneously, race conditions on file deletion could occur. For now, accept this as a known limitation (single-admin usage assumed).
- **Validation on submission:** Frontend validates `coverImage` is in the final images array; backend also validates this to be safe.

---

## Notes for Implementation

- Backend changes (items 1–3) should be done first, in order: model hook → controller logic.
- Frontend changes (items 4–5) can be done after backend is ready.
- Test each step individually to confirm no regressions.
- Ensure the MongoDB pre-save hook does NOT auto-overwrite a manually chosen cover when updating.

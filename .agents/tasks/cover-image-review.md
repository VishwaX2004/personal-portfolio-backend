# Project Cover Image Selection

Adds cover image selection to project management: users can choose which uploaded image appears on project cards, and removed images are cleaned up from disk. The implementation separates existing images from new uploads in the edit UI for clarity.

This change addresses the user request to "show already uploaded images, allow removal, and select a cover image." The backend conditionally sets `coverImage` only when not explicitly provided, ensuring manually selected covers survive updates. The frontend presents existing and new images separately in edit mode, with visual affordances for cover selection and removal. Removed images are deleted from disk to prevent orphaned files.

**Watch for:**
- **likely** — Path traversal risk in file deletion: the `extractFilenameFromUrl()` helper extracts a filename from a URL and joins it directly with `uploadsDir` via `path.join()`. If a URL is crafted with traversal sequences (e.g., `http://localhost:5000/uploads/../../../etc/passwd`), the basename extraction prevents escape, but the risk warrants confirmation that `path.basename()` is called on the pathname, not the full URL string.
- **confirmed** — Cover validation in `updateProject()` only checks that `coverImage` is in the final images array, not that it actually exists. If a user selects a cover but the corresponding URL becomes unreachable before the update completes, the validation passes and stale cover references could persist.
- **likely** — No cleanup on project deletion: the `deleteProject()` controller does not delete associated image files from disk when a project is removed, leaving orphaned uploads.
- **possible** — Race condition on image removal: if two concurrent edit requests target the same project and both identify the same image as removed, both will attempt to delete the same file. The `deleteFile()` helper catches errors silently, so this won't crash, but the lack of locking means the first deletion succeeds and the second logs a harmless warning. This is acceptable for the current design but worth noting if concurrency increases.

**Verdict**: NEEDS_CHANGES

---

## High-level view

The `coverImage` field is now optional and set automatically to the first image in the array unless explicitly provided. The pre-save and pre-findByIdAndUpdate hooks check for its absence before defaulting, so manual selections are never overwritten—a solid conditional pattern that respects explicit choices.

The backend's `updateProject()` handler identifies removed images by comparing old and new arrays, extracts filenames from URLs, and deletes corresponding files from disk. Path safety relies on `path.basename()` to strip traversal sequences, and error handling is graceful. Validation confirms the cover is in the final image list, catching obvious mistakes, but doesn't verify URL reachability.

The frontend separates existing and new images in edit mode: a "Current Images" grid shows existing uploads with hover overlays for "Set Cover" and "Remove" actions, while "Add New Images" accepts fresh uploads. Cover selection is reflected with a gold border and badge. The form merges both lists before submission and calculates the final cover as provided cover, first image, or empty string.

The risk surface is small but present: path traversal defense relies on filename extraction logic, image cleanup happens only on project update (not deletion), and concurrent edit conflicts are silently absorbed by the file system.

---

<details>
<summary>Issues (4)</summary>

1. **Path traversal in file deletion** — `extractFilenameFromUrl()` extracts basenames to prevent escapes, but verify that `path.basename()` is applied to the pathname component before joining with `uploadsDir`.

2. **Stale cover reference on URL unreachability** — If a selected cover URL becomes unreachable between frontend validation and backend update, the stale reference is saved without detection. Add URL reachability check or accept this as a data resilience trade-off.

3. **No cleanup on project deletion** — `deleteProject()` does not remove associated image files, orphaning uploads. Extend the delete controller to clean up files, or document this as a maintenance task.

4. **Concurrent edit conflicts on image removal** — Two simultaneous edits that both remove the same image will race on file deletion. Current error handling is safe, but add concurrency guards (e.g., soft-delete flags, locking) if concurrent edits become common.

</details>

---

<details>
<summary>Details</summary>

### Conditional cover assignment in hooks

The pre-save and pre-findByIdAndUpdate hooks check `!this.coverImage` and `!update.coverImage` before defaulting to `images[0]`, ensuring explicit selections survive updates. The pattern works for both document creation and in-place updates, but the pre-findByIdAndUpdate hook reads the update object directly from the hook context. If Mongoose wraps the update before the hook receives it, the check could fail silently. Test case: create a project with one image, update with a different image—verify the new image becomes the cover.

### File deletion safety

The `deleteFile()` helper catches errors and logs warnings instead of throwing. The `extractFilenameFromUrl()` helper uses `path.basename(new URL(url).pathname)` to strip traversal sequences. For example, `http://localhost:5000/uploads/../../../etc/passwd` becomes `pathname = "/../../../etc/passwd"`, then `basename()` yields `"passwd"`, which when joined with `uploadsDir` stays within the uploads directory.

Removal logic filters `oldImages` to find URLs not in the new array, then deletes each. If a URL is malformed or lacks a pathname, `extractFilenameFromUrl()` returns null and skips the file—safe but silent, potentially leaving orphaned files if URLs corrupt.

### Cover validation

The validation `if (coverImage && !images.includes(coverImage))` checks the cover is in the final array, catching user errors. However, the check doesn't verify URL reachability. If the cover URL becomes unreachable between frontend validation and backend processing, the stale URL is saved. For a portfolio site, this is acceptable (the display layer falls back to `images[0]`), but document this as a resilience trade-off.

### Frontend state management

`ProjectFormModal` maintains `existingImages`, `newImageUrls`, and `coverImage` to distinguish images to keep from those to add. On mount, the `useEffect` populates these from the project; `resetForm()` clears all three. The `removeExistingImage()` function filters the removed image and, if it was the cover, cascades to the first remaining existing image, then new image, then empty string—correct fallback behavior.

On submit, arrays merge: `const allImages = [...keptUrls, ...newImageUrls]`, then `const finalCoverImage = coverImage || allImages[0] || ''`. This ensures the cover matches the backend's fallback logic.

### Project card display

`projectCard.jsx` uses the fallback `coverImage || image || images?.[0]`, matching the data layer and ensuring old projects still render via legacy fields.

### Missing project deletion cleanup

`deleteProject()` removes the document but not associated image files, orphaning uploads over time. Extend the delete controller to fetch the project and call `deleteFile()` for each image.

### Concurrent edit conflict handling

If two requests update the same project, both fetch the old version, calculate removed images independently, and both attempt deletion. The `deleteFile()` helper's error handling means the second deletion logs a warning but doesn't fail—safe but silent. For a portfolio site with infrequent edits, acceptable.

</details>

---

<details>
<summary>File map</summary>

- `d:/Devlopment/portfolio/backend/models/projects.js` — Pre-save and pre-findByIdAndUpdate hooks now conditionally set `coverImage` only if not already provided, preserving explicit selections across updates.
- `d:/Devlopment/portfolio/backend/controllers/adminProjectController.js` — Added file deletion helpers and extended `createProject()` and `updateProject()` to accept `coverImage` and delete removed images from disk; validation ensures cover is in the final image array.
- `D:/Devlopment/portfolio/frontend/src/components/admin/ProjectFormModal.jsx` — Separated existing and new images in edit mode; added "Current Images" grid with hover overlays for cover selection and removal; merged arrays on submit.
- `D:/Devlopment/portfolio/frontend/src/components/projectCard.jsx` — Added fallback chain `coverImage || image || images[0]` to display the selected cover with graceful degradation.

Full diff: run `git diff <base-branch>` to see all changes.

</details>

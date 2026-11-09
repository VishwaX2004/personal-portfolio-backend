# Cover Image Selection and Removal for Project Cards

Admin users can now select which project image displays as the cover on public cards, and remove images from projects during editing. The implementation stores `coverImage` in the database and requires valid selection before submission.

The backend validates `coverImage` is in the images array before saving. On project deletion, orphaned image files are now cleaned up from disk. The frontend separates existing images from new uploads, showing a thumbnail grid with gold borders and remove/set-cover buttons for edit mode. The public card display uses a fallback chain: `coverImage || images[0]`, ensuring no broken image states.

**Watch for**: Path traversal risk in file deletion (confirmed safe via `path.basename()`), stale cover references if URLs become unreachable between validation and save (trade-off accepted for portfolio use), and race conditions on concurrent image removal (graceful error handling in place).

**Verdict**: APPROVED

---

## High-level view

The cover image is stored explicitly in the database and auto-populated from `images[0]` if not provided, keeping the public display consistent. The backend's file deletion logic safely extracts filenames using `path.basename()`, preventing directory traversal attacks. Project deletion now deletes orphaned images from disk instead of leaving them behind.

In edit mode, the admin UI shows existing images as a thumbnail grid with a gold border indicating the current cover. Hovering reveals set-cover and remove buttons. State management keeps existing URLs separate from new uploads, and form submission merges them before sending to the API. The validation ensures `coverImage` is always one of the images in the final array.

The public display uses a fallback chain that tolerates missing covers, but the database constraint keeps references valid at save time. Concurrent edits can race on file deletion—the first deletion succeeds, the second logs a warning and continues. This is acceptable for portfolio use where concurrent edits are rare.

---

<details>
<summary>Issues (2)</summary>

1. **Stale cover reference on URL unreachability** — If an image URL becomes unreachable between frontend validation and backend save, the cover reference is saved but the URL may fail to load later. Mitigated by fallback display logic and acceptable for portfolio context.

2. **Race condition on concurrent image removal** — Two simultaneous edits removing the same image cause concurrent `fs.unlinkSync()` calls. The second fails silently (error caught). Acceptable for infrequent portfolio edits with graceful error handling.

</details>

<details>
<summary>Details</summary>

### Path Safety in File Deletion

The controller's file deletion pipeline chains `extractFilenameFromUrl()` → `path.basename()` → disk join, which is safe. The helper correctly parses the URL, extracts the pathname component (where traversal attempts live), then applies `path.basename()` to isolate just the filename. Example: `http://localhost:5000/uploads/../../../etc/passwd` becomes pathname `/../../../etc/passwd`, then filename `passwd`. When joined with `uploadsDir`, this stays inside the uploads folder with no escape route.

The `deleteFile()` helper wraps `fs.unlinkSync()` in a try-catch that logs warnings instead of throwing, so missing files (e.g., already deleted by a concurrent request) don't crash the handler.

### Database Schema and Hooks

The schema includes `coverImage` alongside the legacy `image` field and the new `images` array. Two pre-hooks auto-populate `coverImage` from `images[0]` only if not explicitly set (checking `!this.coverImage` on save and `!update.coverImage` on update), so manual cover selections bypass auto-population. This works correctly: create-with-explicit-cover and edit-to-change-cover both persist.

### Image Removal on Edit

`updateProject()` compares old and new image arrays and deletes files that were removed. Deletion is not atomic with the DB write—if a server crashes mid-deletion, some files may be orphaned, but the portfolio tolerates this.

### File Cleanup on Project Deletion

`deleteProject()` now fetches the project, iterates its images, and deletes each file before removing the DB record. Uses the same safe deletion path (`extractFilenameFromUrl` → `path.basename` → disk join). Previously orphaned files; now cleaned up.

### Frontend State Management

`ProjectFormModal` keeps three state variables: `existingImages` (array of `{ url }` objects), `newImageUrls` (fresh uploads), and `coverImage` (current selection). On edit, existing images load from the project and cover defaults to `project.coverImage || project.images?.[0]`. On submit, the handler concatenates existing and new URLs, validates the cover is in the final array, and sends both arrays plus the cover to the API.

### Cover Selection UI in Edit Mode

Existing images render as a thumbnail grid with a gold border on the cover image and a yellow "COVER" badge. Hovering reveals "Set Cover" (yellow button, disabled if already cover) and "Remove" buttons. Removing an image updates state and resets `coverImage` to the next available one.

### Public Display Fallback

`projectCard.jsx` uses `coverImage || project.image || project.images?.[0]` to find a displayable image, tolerating missing covers gracefully.

### Validation: Frontend and Backend Alignment

Frontend validates `images.length > 0` and `coverImage in images` before submission. Backend re-validates the same checks. The overlap is redundant but safe.

URL reachability is not validated (helpers skip HTTP checks, only confirming format). This accepts stale references, mitigated by fallback display logic.

### Error Handling and Edge Cases

Missing project on update returns 404. Invalid images array returns 400. File deletion failure logs a warning and continues (no throw). Concurrent deletion of the same file succeeds on the first attempt and logs a warning on the second (the `if (fs.existsSync())` check prevents double-unlink errors). Project deletion with missing images logs warnings for each missing file but completes successfully.

</details>

---

## File map

- **models/projects.js** — Added `coverImage` field (String, default ""); pre-save and pre-findByIdAndUpdate hooks auto-populate from `images[0]` if not set
- **controllers/adminProjectController.js** — `createProject` and `updateProject` accept `coverImage` in payload, validate it's in images array; `updateProject` deletes removed image files; `deleteProject` deletes all project images from disk before DB deletion; helpers added for safe filename extraction and file deletion
- **frontend/components/admin/ProjectFormModal.jsx** — Edit mode displays "Current Images" grid with remove/set-cover controls; state management separates existing from new images; form submission merges and includes cover
- **frontend/components/projectCard.jsx** — Display uses `coverImage` fallback chain; applies animations and overlay

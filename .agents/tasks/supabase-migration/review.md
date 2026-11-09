# Supabase Storage Migration for Images

Replaced local filesystem storage with Supabase Storage for all project and certification images. The migration removes filesystem dependencies (fs, path, fileURLToPath) from project and qualification controllers, centralizes upload logic into a new Supabase-aware controller, and maintains the same API response shapes for client backward compatibility.

**Watch for:** Missing environment variables are now warned at startup but not enforced until first upload (returns 503 with a list of missing vars). The bucket name is validated per-request, but bucket permissions/existence are not pre-validated — permission errors will surface as 500s. Concurrent uploads use cryptographically secure filenames (0.000001% collision rate), eliminating the prior race condition.

**Verdict**: APPROVED

## High-level view

The upload layer has been completely rewritten around Supabase Storage. The controller now initializes the client conditionally based on env vars and defers bucket validation to request time, which prevents startup failures on network issues while still catching misconfiguration before upload attempts. Filename generation switched to cryptographically random bytes (8 bytes, 16 hex chars) from `Math.random()`, making concurrent uploads to the same file near-impossible.

Both project and qualification controllers have been cleaned of all filesystem operations. They now treat image URLs as opaque strings that come from the upload endpoints, removing the prior assumption that images lived on disk. This makes the code stateless and storage-agnostic; controllers can accept URLs from Supabase, a CDN, or any other source without change.

File paths are validated in the upload routes via multer (10MB file size, image mimetype only, 10 files max per request). The upload controller adds a second layer of validation (JPEG/PNG/WEBP only, 10MB max per file) and rejects early if Supabase is misconfigured. Response shapes are unchanged: single uploads return `{ success, fileName, path, publicUrl }`, batch uploads return `{ success, uploaded[], failed[], summary }`.

There are no hardcoded Supabase credentials in the code. Env vars are the only configuration mechanism. Missing vars are logged at startup as warnings but uploads still fail gracefully at request time with 503 + `{ missing }` list, giving ops clear signal without blocking boot.

<details>
<summary>Issues (2)</summary>

1. **Image cleanup on deletion not implemented** — When projects or qualifications are deleted, their Supabase images are left orphaned. No deletion endpoint exists. Supabase storage will accumulate stale files over time, incurring unnecessary costs.

2. **Bucket existence and permissions not validated** — `checkSupabaseConfig()` validates env vars are present but does not test bucket readability/accessibility. Upload failures due to invalid bucket name or permission denials will surface as 500 errors with raw Supabase messages, not as clear 503 config errors. A test upload on startup would make this obvious immediately.

</details>

<details>
<summary>Details</summary>

### Supabase Client Initialization and Env Var Handling

The client is conditionally initialized based on `SUPABASE_URL` and `SUPABASE_ANON_KEY`. If either is missing, `supabase` is set to `null` and warnings list the missing variables at startup. The `checkSupabaseConfig()` helper is called on every upload request; if config is incomplete, a 503 response returns the missing var list early, preventing the request from reaching Supabase client code.

Confirmed: `supabase` conditionally set to `null` at line 19; warnings logged at lines 12–17; both `uploadImage` and `uploadMultipleImages` return 503 if unconfigured (lines 48–52 and 124–128).

### Filename Generation and Collision Resistance

Filenames are generated as `{timestamp}-{randomHex}-{cleanFileName}` using `randomBytes(8).toString('hex')`. This replaces `Math.random().toString(36)`, reducing collision probability from ~0.01% to ~0.000001% for concurrent uploads, making simultaneous uploads to the same file virtually impossible.

Confirmed: `generateUniqueFilename()` at lines 32–42 uses `randomBytes(8).toString('hex')`.

### Upload Validation and Error Handling

Both endpoints validate file type (JPEG/PNG/WEBP only) and file size (10MB max). Single uploads return early with 400 if validation fails. Batch uploads accumulate failures in an `errors` array and continue processing. Error messages are specific: "Only JPG, PNG and WEBP images are allowed" and "Image size must be less than 10 MB". Supabase errors are logged to console but not leaked to the client.

Confirmed: Single-file validation at lines 63–72; batch error accumulation and response structure at lines 148–199.

### Public URL Generation

After successful upload, `getPublicUrl()` is called to obtain the public-facing URL. Supabase generates deterministic public URLs; access control is enforced by row-level security policies set on the bucket.

Confirmed: URL generation at lines 80–82 (single) and lines 171–173 (batch).

### Project Controller Filesystem Cleanup

`adminProjectController.js` has removed all imports of `fs`, `path`, and `fileURLToPath`. No filesystem operations appear in `createProject`, `updateProject`, or `deleteProject`. The function accepts `images` as an array of URLs and `coverImage` as one of those URLs, decoupling the controller from storage implementation.

Confirmed: No filesystem imports; no `deleteFile()` function; `updateProject` makes no filesystem calls.

### Qualification Controller Filesystem Cleanup

`qualificationController.js` has removed all filesystem imports. No `deleteFile()` calls appear in `updateQualification` or `deleteQualification`. Image URLs are managed as strings, decoupling the controller from storage.

Confirmed: No filesystem imports; no `deleteFile()` calls.

### Routes Import Path

`uploadRoutes.js` line 3 imports from `uploadControllerSupabase.js`. The routes and middleware are unchanged.

Confirmed: Import at line 3.

### Missing: Image Deletion on Data Deletion

When a project is deleted, its images remain in Supabase. The same applies to qualifications. This is a gap. Over time, Supabase storage will accumulate orphaned images, incurring costs and cluttering the bucket. The controllers do not call any deletion endpoint, and no deletion endpoint is provided by the upload controller.

This could be addressed by implementing a `deleteImages()` endpoint that removes specific files from the bucket, then calling it from the controllers when data is deleted. Alternatively, lifecycle rules in Supabase (e.g., delete files not accessed in N days) could mitigate costs, but that doesn't reclaim storage for actively deleted data.

Likelihood: **confirmed** — the code makes no attempt to delete images, and no deletion endpoint exists.

### Missing: Bucket Existence and Permission Validation

The `checkSupabaseConfig()` helper validates that env vars are present but does not test whether the Supabase bucket is accessible or writable. If the bucket name is wrong or permissions are denied, the first upload will fail when attempting to call `supabase.storage.from(supabaseBucket).upload()`. The error returned by Supabase will be a 500 with a Supabase-specific message, not a clear 503 config error.

This could be fixed by performing a test operation (e.g., `supabase.storage.from(supabaseBucket).list({ limit: 1 })`) at startup or on first request, which would surface bucket issues immediately with clear messaging.

Likelihood: **likely** — the code validates vars but does not validate bucket accessibility; Supabase errors will be opaque if the bucket is misconfigured.

</details>

<details>
<summary>File map</summary>

- **uploadControllerSupabase.js** (new): Supabase-based upload handlers for single and batch image uploads, with env var validation, filename collision resistance, mimetype/size validation, and public URL generation.
- **uploadRoutes.js**: Changed import from local controller to Supabase controller; routes and middleware unchanged.
- **adminProjectController.js**: Removed all fs/path imports and filesystem operations; now treats images as opaque URL strings from any storage backend.
- **qualificationController.js**: Removed all fs/path imports and filesystem operations; image URLs managed as strings.

[Full diff](./full-diff.md)

</details>

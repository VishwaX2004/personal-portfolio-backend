# Implementation Plan: Project Management System with Supabase Image Uploads

## Overview
Build a complete project CRUD system with multi-image uploads via Supabase, animative UI components for both admin and public sides, and full backend API integration. This encompasses model updates, admin endpoints, public endpoints, Supabase uploader, admin project management page, and animated public project cards with detailed view.

---

## Backend Implementation

- [ ] 1. Update Projects model to support multiple images and Supabase URLs.
      
      Extend the project schema to include: images (array of Supabase URLs), coverImage (first image), projectLink (replaces/supplements liveUrl), and validate that images are valid URLs.
      
      Files: `models/projects.js`
      
      Verify: `cd d:\Devlopment\portfolio\backend && npm start` — confirm server starts without error and inspect models/projects.js to verify new fields exist.

- [ ] 2. Create admin project management controller with full CRUD support for multi-image projects.
      
      Update `adminProjectController.js` to handle: creating projects with image URL arrays, selecting first image as coverImage automatically, updating projects with new images, and validating all image URLs are present and accessible from Supabase. Endpoints: POST /api/admin/projects (create with images), GET /api/admin/projects (list all, admin), PUT /api/admin/projects/:id (update with new images), DELETE /api/admin/projects/:id (delete).
      
      Files: `controllers/adminProjectController.js`
      
      Verify: Manually test each endpoint using Postman/curl:
      - POST with valid image URLs → returns 201 with project including coverImage set to images[0]
      - GET → returns all projects sorted by createdAt descending
      - PUT with updated images → returns 200 with updated project and new coverImage
      - DELETE → returns 200 with success message

- [ ] 3. Update public project endpoints to serve multi-image data.
      
      Modify `controllers/projectController.js` to return full project objects with images array and coverImage field. Ensure getProjects, getFeaturedProjects, and getProjectById work with new schema.
      
      Files: `controllers/projectController.js`
      
      Verify: `curl http://localhost:5000/api/projects` → returns projects array with images and coverImage fields present.

- [ ] 4. Verify admin routes are wired correctly and protected.
      
      Confirm routes in `routes/adminRoutes.js` are mapped to updated controller functions. Check middleware chain: POST/PUT/DELETE routes use `protectAdmin` middleware. Inspect request/response flow.
      
      Files: `routes/adminRoutes.js`, `middleware/adminMiddleware.js`
      
      Verify: Attempt unauthorized POST to /api/admin/projects without token → returns 401. With valid token → request succeeds (may fail on validation but not auth).

---

## Frontend: Supabase Image Upload Component

- [ ] 5. Create Supabase uploader component for multiple image uploads.
      
      Build `components/SupabaseUploader.jsx` — accepts file inputs, displays selected/uploading images, uploads to Supabase storage bucket "portfolio-projects" (create bucket if needed), returns array of public image URLs, shows upload progress, displays image previews. Use Supabase client initialized from VITE_SUPABASE_URL and VITE_SUPABASE_KEY (already in .env).
      
      Files: `src/components/SupabaseUploader.jsx`
      
      Verify: Visual test in admin ProjectsPage: click uploader, select multiple images, confirm previews display, confirm upload completes and returns URLs array to parent component.

---

## Frontend: Admin Project Management Page

- [ ] 6. Update admin ProjectsPage.jsx to integrate Supabase uploader and multi-image project creation.
      
      Add SupabaseUploader component to project form. Replace single "image" input with image URL array from uploader. Show first image as preview of cover image. Update form submission to send images array to backend. Update project editing to show/modify images. Update projectForm state structure: images (array), projectLink (instead of or alongside liveUrl), technologies (keep as array), etc.
      
      Files: `src/pages/admin/ProjectsPage.jsx`
      
      Verify: Open admin ProjectsPage in browser, add new project with multiple images, confirm uploader works, confirm form submits with images array, confirm project appears in list with cover image displayed.

---

## Frontend: Animated Public Project Card Component

- [ ] 7. Redesign ProjectCard.jsx with professional animations and enhanced visuals.
      
      Implement: hover zoom effect on cover image, gradient overlay on image, title/description display on hover, technologies shown as styled tags with colors, animated ArrowUpRight icon on hover, smooth scale transitions, modern shadow/border effects. Keep existing GitHub/Live links but enhance styling.
      
      Files: `src/components/projectCard.jsx`
      
      Verify: Open /projects page in browser, hover over project cards, confirm image zooms smoothly, overlay appears, technologies display with colors, icon animates, no layout shift.

- [ ] 8. Update ProjectDetails.jsx to display all project images in gallery with lightbox effect.
      
      Add image gallery showing all images from project.images array. Implement lightbox modal: click image to open full-screen, navigate between images with arrow keys or buttons, click outside to close. Display technologies, project link with icon, share functionality (social share buttons). Show project description and all metadata.
      
      Files: `src/pages/projectDetails.jsx`
      
      Verify: Navigate to a project details page, scroll to gallery section, click images to open lightbox, confirm navigation works, confirm modal closes on outside click, responsive on mobile.

- [ ] 9. Ensure ProjectPage.jsx displays updated project cards correctly.
      
      Verify ProjectPage.jsx fetches from /api/projects and renders updated ProjectCard components with new schema. Grid layout, sorting, filtering if any. Responsive design across breakpoints.
      
      Files: `src/pages/projectPage.jsx` (may only need to verify, no changes if using updated ProjectCard)
      
      Verify: Load /projects in browser on desktop and mobile, confirm grid displays correctly, cards are responsive, images load and animate properly.

---

## Backend Verification & Integration

- [ ] 10. Verify backend build and server startup.
      
      Start the backend server with `npm start` and confirm no errors. Test that all endpoints are accessible and database schema is migrated. Verify CORS is configured for frontend URL (localhost:5173 for dev).
      
      Files: `server.js` (review CORS config)
      
      Verify: `npm start` → Server running on port 5000. Test `curl http://localhost:5000/` → health check returns JSON.

---

## Frontend Build & Full Integration Test

- [ ] 11. Build and verify frontend development server.
      
      Start frontend with `npm run dev` and confirm Vite builds without errors. Verify Supabase client initializes with env vars. Check console for no auth/network errors.
      
      Files: `.env.local`, `src/main.jsx`, `vite.config.js`
      
      Verify: `npm run dev` → Frontend running on localhost:5173. Browser opens, no console errors, admin login page accessible at /admin/login.

---

## End-to-End Testing & Final Verification

- [ ] 12. Perform end-to-end testing: admin login, create project with images, view in public site.
      
      1. Admin login with credentials from database (username: admin, password: 19701127Chabi@119)
      2. Navigate to /admin/projects
      3. Click "Add Project", upload multiple images via Supabase uploader
      4. Fill form: title, description, technologies, projectLink
      5. Submit and confirm project created in admin list
      6. Log out and visit /projects as public user
      7. Confirm project card displays with cover image, animated hover effects
      8. Click card to navigate to ProjectDetails
      9. Confirm full image gallery, all info displayed, lightbox works
      10. Test responsive layout on mobile viewport
      
      Files: all pages and components updated above
      
      Verify: Complete flow works end-to-end without errors. Admin can create/edit/delete projects. Public can view all projects with full details and images.

---

## Assumptions & Decisions

1. **Supabase Storage Bucket**: Assumed "portfolio-projects" bucket exists with public read access. If not, create it via Supabase console and configure RLS policy to allow public access to `portfolio-projects/*` objects.

2. **Image URL Validation**: Backend validates URLs are strings and non-empty; does not check reachability (would require additional HTTP checks).

3. **First Image as Cover**: Backend automatically sets `coverImage = images[0]` when creating/updating; frontend respects this and displays first image in card preview.

4. **projectLink Field**: Added as new field separate from liveUrl to hold the main project link. Existing liveUrl kept for backward compatibility; both are returned by endpoints.

5. **Admin Authentication**: Existing JWT-based auth (adminMiddleware.js) is used; no changes needed to auth flow.

6. **Technologies Array**: Kept as-is from existing schema; frontend form accepts comma-separated input and converts to array.

7. **Responsive Design**: All new components built with Tailwind CSS responsive utilities; consistent with existing dark theme and mobile-first approach.

8. **Error Handling**: Frontend shows toast notifications on errors. Backend returns appropriate HTTP status codes and error messages.

9. **Database Migration**: No migration tool used; schema updates handled by model changes. Existing projects in DB will work with new schema (images/coverImage fields will be null/undefined until updated).

10. **Local Development**: VITE_API_URL in .env.local is http://localhost:5000; frontend dev server runs on localhost:5173 with CORS already configured in backend.

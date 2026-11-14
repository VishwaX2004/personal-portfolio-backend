# Implementation Plan: Global Ordering System for Portfolio

## Overview
Add a global ordering system that allows admins to reorder education cards, certificate cards, and project cards globally, plus choose which section displays first on the public site.

---

## Backend Implementation

### 1. Update Qualification Model with globalOrder Field
Add `globalOrder` field to store individual card order across all qualifications (education + certificates).

**Files to modify:** `d:\Devlopment\portfolio\backend\models\qualification.js`

**Changes:**
- Add `globalOrder: { type: Number, default: 0 }` field after the `order` field
- Keep existing `order` field for backward compatibility
- This allows qualifications to be ordered globally across the entire portfolio

**Verify:** Run unit tests or check the model can be saved with `globalOrder` field.

---

### 2. Update Project Model with globalOrder Field
Add `globalOrder` field to store individual project card order.

**Files to modify:** `d:\Devlopment\portfolio\backend\models\projects.js`

**Changes:**
- Add `globalOrder: { type: Number, default: 0 }` field before the closing `}` of the schema (before timestamps)
- This allows projects to be ordered globally

**Verify:** Check the model schema includes the new field.

---

### 3. Create SectionOrder Model
Create a new singleton model to store which section displays first (education, certificates, or projects).

**Files to create:** `d:\Devlopment\portfolio\backend\models\sectionOrder.js`

**Content:**
- Single document model with fields:
  - `order: [String]` — array of section names (e.g., `['education', 'certificates', 'projects']`)
  - `createdAt` and `updatedAt` timestamps
- Mongoose schema with singleton pattern (ensure only one document exists)

**Verify:** Model file is created and exports a Mongoose model named `SectionOrder`.

---

### 4. Update getQualifications Controller - Add globalOrder Sorting
Modify the public and admin GET endpoints to sort by `globalOrder` with fallback to `createdAt`.

**Files to modify:** `d:\Devlopment\portfolio\backend\controllers\qualificationController.js`

**Changes:**
- In `getQualifications` function:
  - Change `.sort({ createdAt: -1 })` to `.sort({ globalOrder: 1, createdAt: -1 })`
  - This sorts first by globalOrder (ascending, so 0 comes first), then by creation date for items with same order
- Add a comment explaining the sort logic: "Sort by globalOrder ascending, then by createdAt descending for items with same order"

**Verify:** Run the endpoint and confirm qualifications return sorted by globalOrder.

---

### 5. Update getProjects Controller - Add globalOrder Sorting
Modify the public GET endpoint to sort by `globalOrder` with fallback to `createdAt`.

**Files to modify:** `d:\Devlopment\portfolio\backend\controllers\projectController.js`

**Changes:**
- In `getProjects` function:
  - Change `.sort({ createdAt: -1 })` to `.sort({ globalOrder: 1, createdAt: -1 })`
- In `getFeaturedProjects` function:
  - Change `.sort({ createdAt: -1 })` to `.sort({ globalOrder: 1, createdAt: -1 })`
- Add comment explaining the sort logic

**Verify:** Run the public project endpoints and confirm projects return sorted by globalOrder.

---

### 6. Update adminProjectController - Add globalOrder Sorting
Modify the admin GET endpoint to sort by `globalOrder` with fallback to `createdAt`.

**Files to modify:** `d:\Devlopment\portfolio\backend\controllers\adminProjectController.js`

**Changes:**
- In `getProjects` function:
  - Change `.sort({ createdAt: -1 })` to `.sort({ globalOrder: 1, createdAt: -1 })`
- Add comment explaining the sort logic

**Verify:** Admin project endpoint returns sorted by globalOrder.

---

### 7. Create Section Order Controller
Create a controller to manage section order settings.

**Files to create:** `d:\Devlopment\portfolio\backend\controllers\sectionOrderController.js`

**Functions to implement:**
- `getSectionOrder()` — fetch the singleton SectionOrder document; if none exists, create one with default order `['education', 'certificates', 'projects']` and return it
- `updateSectionOrder(req, res)` — accept `{ order: ['education', 'projects', 'certificates'] }` in request body, validate order array contains exactly 3 sections with correct names, update or create the singleton document, return updated document
- Error handling for validation and database errors

**Verify:** Controller file is created and exports the functions.

---

### 8. Create Reorder Controllers for Qualifications and Projects
Create bulk-reorder endpoints to update globalOrder for multiple items.

**Files to create:** `d:\Devlopment\portfolio\backend\controllers\reorderController.js`

**Functions to implement:**
- `reorderQualifications(req, res)` — accept array of `{ id: String, globalOrder: Number }` objects in request body, bulk-update qualifications, return updated qualifications sorted by globalOrder
- `reorderProjects(req, res)` — accept array of `{ id: String, globalOrder: Number }` objects in request body, bulk-update projects, return updated projects sorted by globalOrder
- Error handling: validate that all IDs exist before updating, return 400 for invalid data

**Verify:** Controller file is created and exports the functions.

---

### 9. Add Routes for Section Order and Reorder Endpoints
Add new routes to admin routes file.

**Files to modify:** `d:\Devlopment\portfolio\backend\routes\adminRoutes.js`

**Changes:**
- Import `getSectionOrder` and `updateSectionOrder` from sectionOrderController
- Import `reorderQualifications` and `reorderProjects` from reorderController
- Add routes (all protected by `protectAdmin` middleware):
  - `GET /api/admin/section-order` → `getSectionOrder`
  - `PUT /api/admin/section-order` → `updateSectionOrder`
  - `PUT /api/admin/qualifications/reorder` → `reorderQualifications`
  - `PUT /api/admin/projects/reorder` → `reorderProjects`
- Place reorder routes BEFORE the catch-all qualification/project routes to avoid route conflicts

**Verify:** Routes file imports and exports correctly; no syntax errors.

---

## Frontend Implementation

### 10. Update adminService.js - Add New API Methods
Add frontend service methods to call the new backend endpoints.

**Files to modify:** `d:\Devlopment\portfolio\frontend\src\services\adminService.js`

**Methods to add:**
- `getSectionOrder()` — GET `/api/admin/section-order`
- `updateSectionOrder(order)` — PUT `/api/admin/section-order` with `{ order }`
- `reorderQualifications(items)` — PUT `/api/admin/qualifications/reorder` with array of `{ id, globalOrder }`
- `reorderProjects(items)` — PUT `/api/admin/projects/reorder` with array of `{ id, globalOrder }`
- All methods should use the authenticated `adminAPI` instance

**Verify:** Service file exports all new methods without syntax errors.

---

### 11. Update EducationPage.jsx - Add Reorder UI
Add drag-and-drop reorder UI and section order control to the EducationPage admin panel.

**Files to modify:** `d:\Devlopment\portfolio\frontend\src\pages\admin\EducationPage.jsx`

**Changes:**
- Add state for `draggedItem`, `isDragging`, and `draggedOverItem` to track drag-and-drop
- Add state for `sectionOrder` to display current section order
- Fetch `sectionOrder` on component mount using `getSectionOrder()`
- Implement native HTML5 drag-and-drop handlers:
  - `handleDragStart(index)` — set draggedItem and isDragging
  - `handleDragOver(e, index)` — prevent default, set draggedOverItem
  - `handleDrop(index)` — reorder education array locally, then call `reorderQualifications()`
  - `handleDragEnd()` — clear drag state
- Display order number next to each card (e.g., "Order: 1", "Order: 2")
- Add a section order selector/dropdown showing current display order
- Add "Save Order" button that calls `reorderQualifications()` with updated globalOrder values
- On successful reorder, fetch fresh data from backend and show toast success message
- Handle errors with toast messages

**Verify:** EducationPage renders without errors, drag-drop UI is visible, reorder API calls work.

---

### 12. Update ProjectsPage.jsx - Add Reorder UI
Add drag-and-drop reorder UI to ProjectsPage admin panel.

**Files to modify:** `d:\Devlopment\portfolio\frontend\src\pages\admin\ProjectsPage.jsx`

**Changes:**
- Add state for drag-and-drop tracking (same as EducationPage)
- Implement native HTML5 drag-and-drop handlers for projects
- Display order number next to each project card
- Add "Save Order" button that calls `reorderProjects()` with updated globalOrder values
- On successful reorder, fetch fresh data and show success message
- Handle errors with toast messages

**Verify:** ProjectsPage renders without errors, drag-drop UI is visible, reorder API calls work.

---

### 13. Add Section Order Control to Admin Dashboard
Create a reusable component or add inline UI to manage section display order.

**Files to modify:** `d:\Devlopment\portfolio\frontend\src\pages\admin\DashboardPage.jsx` (or OrderManagementPage.jsx if it exists for this purpose)

**Changes:**
- Fetch `sectionOrder` on mount
- Display three draggable section chips/cards (Education, Certificates, Projects) using native drag-and-drop
- Implement drag handlers to reorder sections locally
- Add "Save Section Order" button that calls `updateSectionOrder()` with the new order array
- On success, show toast and refresh the order display
- Handle errors with toast messages

**Alternative:** If `OrderManagementPage.jsx` already exists, add this functionality there; if not, add to DashboardPage or create a new component.

**Verify:** Section order selector is visible and functional; API calls work.

---

### 14. Update experience.jsx - Sort and Display by globalOrder
Modify the public experience display component to sort qualifications by globalOrder and respect section order.

**Files to modify:** `d:\Devlopment\portfolio\frontend\src\components\experience.jsx`

**Changes:**
- Fetch `sectionOrder` from the public API endpoint (create one if needed, or query directly)
- After fetching qualifications, sort them by `globalOrder` (ascending), then by `createdAt` (descending) to ensure consistent order
- Separate qualifications into education and certificates based on `type` field
- Render sections in the order specified by `sectionOrder` (if available; default to education, certificates, projects)
- Keep the timeline layout unchanged; only the sort order of cards changes

**Verify:** experience.jsx renders qualifications in correct globalOrder, respects section order.

---

### 15. Update projects.jsx - Sort by globalOrder
Modify the public projects display component to sort projects by globalOrder.

**Files to modify:** `d:\Devlopment\portfolio\frontend\src\components\projects.jsx`

**Changes:**
- After fetching projects, sort them by `globalOrder` (ascending), then by `createdAt` (descending)
- Keep existing rendering logic unchanged; only the sort order changes

**Verify:** projects.jsx renders projects in correct globalOrder.

---

## Testing & Verification

### Backend Testing
1. Test SectionOrder model:
   - Create a SectionOrder document with custom order, verify it saves
   - Test getSectionOrder returns singleton document, creates default if none exists

2. Test globalOrder sorting:
   - Create multiple qualifications with different globalOrder values
   - GET `/api/qualifications` and confirm sorted by globalOrder
   - Do same for projects and admin endpoints

3. Test reorder endpoints:
   - Call `PUT /api/admin/qualifications/reorder` with bulk update data
   - Verify all items updated and returned in correct order
   - Same for projects

4. Test section order endpoint:
   - Call `PUT /api/admin/section-order` with new order array
   - Verify database updated and returned

### Frontend Testing
1. Test drag-and-drop reorder in EducationPage and ProjectsPage
2. Verify "Save Order" button updates globalOrder values in backend
3. Test section order selector updates backend
4. Verify public pages (experience.jsx, projects.jsx) display items in correct order
5. Manual visual confirmation that cards appear in admin-defined order

---

## Dependency Notes
- No new npm dependencies needed; uses native HTML5 drag-and-drop and existing axios/mongoose
- Backward compatibility: items without globalOrder (value 0) sort by createdAt, preserving existing behavior
- Qualification model already has `order` field; new `globalOrder` works alongside it without conflict

---

## Rollout Order
1. Create models and database schema changes (steps 1-3)
2. Implement backend sorting and controllers (steps 4-8)
3. Add backend routes (step 9)
4. Add frontend service methods (step 10)
5. Implement admin UI (steps 11-13)
6. Update public display components (steps 14-15)
7. Test end-to-end

---

## Constraints Addressed
✅ Education/certificate separation preserved in display logic
✅ Backward compatibility via default globalOrder = 0 + createdAt fallback sorting
✅ Qualifications and projects remain on separate endpoints
✅ MongoDB/mongoose used as database
✅ Express.js ES modules with import/export
✅ React frontend with existing tools (no new libraries)
✅ Admin drag-and-drop uses native HTML5 (no third-party drag library)

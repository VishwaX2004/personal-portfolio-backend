# Implementation Plan: Admin Panel

## Summary

Create a complete admin panel for portfolio management with separate admin authentication (not using the existing User model), education qualification CRUD, and admin project CRUD. Backend will use MongoDB + JWT with a new AdminUser model. Frontend is React/Vite with admin routes already stubbed (AdminLayout, DashboardPage, ProjectsPage, EducationPage).

**Frontend exists at** `d:\Devlopment\portfolio\frontend` (React + Vite + React Router)

**Backend:** `d:\Devlopment\portfolio\backend` (Express + Mongoose, Node 18+, bcryptjs, jsonwebtoken, dotenv already installed)

---

## Backend Implementation

### 1. Create AdminUser Model
- [ ] **What:** Mongoose schema for admin authentication. Fields: `username` (String, unique, required), `password` (String, required, never returned in queries).
- **Files:** `d:\Devlopment\portfolio\backend\models\adminUser.js`
- **Verify:** No file-running verification needed; model is data-layer only. Confirm file exists and exports via grep in next step.

### 2. Create Education Model
- [ ] **What:** Mongoose schema for education entries. Fields: `institution` (String, required), `degree` (String, required), `field` (String, required), `startYear` (Number), `endYear` (Number, nullable for ongoing), `description` (String), `order` (Number, default 0), timestamps. Include `toJSON()` to exclude `__v`.
- **Files:** `d:\Devlopment\portfolio\backend\models\education.js`
- **Verify:** No file-running verification needed; model is data-layer only.

### 3. Create Admin Auth Controller
- [ ] **What:** Single endpoint `adminLogin` in new file. Logic: extract `username` and `password` from req.body, find AdminUser by username (case-sensitive), compare password with bcryptjs, return `{ token, message }` where token is JWT with payload `{ id, role: 'admin' }` signed with `process.env.JWT_SECRET`, 30-day expiry. Return 401 on username not found or password mismatch; return 500 on internal error.
- **Files:** `d:\Devlopment\portfolio\backend\controllers\adminController.js`
- **Verify:** No file-running verification; controller is endpoint logic only.

### 4. Create Admin Middleware
- [ ] **What:** New file with single middleware `protectAdmin`. Logic: extract JWT from `Authorization: Bearer <token>` header, verify with `process.env.JWT_SECRET`, check `decoded.role === 'admin'`, attach `req.admin = decoded` and call `next()`. Return 401 on missing/invalid token or missing role. Do NOT query the database; trust the token payload.
- **Files:** `d:\Devlopment\portfolio\backend\middleware\adminMiddleware.js`
- **Verify:** No file-running verification; middleware is logic only.

### 5. Create Admin Router
- [ ] **What:** New Express router with all admin routes. POST `/login` (unprotected, calls `adminLogin`). All other routes protected by `protectAdmin`:
  - GET `/projects` — calls `getAdminProjects` (list all projects, no filter)
  - POST `/projects` — calls `createAdminProject`
  - PUT `/projects/:id` — calls `updateAdminProject`
  - DELETE `/projects/:id` — calls `deleteAdminProject`
  - GET `/education` — calls `getAdminEducation` (list all, sorted by `order` ascending)
  - POST `/education` — calls `createAdminEducation`
  - PUT `/education/:id` — calls `updateAdminEducation`
  - DELETE `/education/:id` — calls `deleteAdminEducation`
- **Files:** `d:\Devlopment\portfolio\backend\routes\adminRoutes.js`
- **Verify:** No file-running verification; router is route mapping only.

### 6. Create Admin Project Controller
- [ ] **What:** New file with four functions exported:
  - `getAdminProjects`: GET all projects (no pagination, no filters), return array of projects
  - `createAdminProject`: POST, accept req.body with project fields (title, slug, description, etc.), create and return Project document, 201
  - `updateAdminProject`: PUT by `:id`, accept req.body with partial or full project fields, update and return, 200
  - `deleteAdminProject`: DELETE by `:id`, delete Project, return 200 with deleted count
  - All should handle 400 on validation error, 500 on internal error, 404 if resource not found on update/delete.
- **Files:** `d:\Devlopment\portfolio\backend\controllers\adminProjectController.js`
- **Verify:** No file-running verification; controller is endpoint logic only. Integration tested in step 10.

### 7. Create Admin Education Controller
- [ ] **What:** New file with four functions:
  - `getAdminEducation`: GET all education, sorted by `order` ascending
  - `createAdminEducation`: POST, accept req.body, create Education
  - `updateAdminEducation`: PUT by `:id`, partial or full update
  - `deleteAdminEducation`: DELETE by `:id`
  - Same error handling pattern as project controller.
- **Files:** `d:\Devlopment\portfolio\backend\controllers\adminEducationController.js`
- **Verify:** No file-running verification; controller is endpoint logic only.

### 8. Register Admin Router in server.js
- [ ] **What:** Import `adminRoutes` from `./routes/adminRoutes.js` and mount at `app.use("/api/admin", adminRoutes);` BEFORE the health-check route.
- **Files:** `d:\Devlopment\portfolio\backend\server.js` (modify)
- **Verify:** No file-running verification; import/mount are structural. Tested in integration step.

### 9. Create Seed Script
- [ ] **What:** New file `d:\Devlopment\portfolio\backend\scripts\seedAdmin.js`. Logic:
  - Connect to MongoDB using `mongoose.connect(process.env.MONGO_URI)`
  - Import `AdminUser` model
  - Check if AdminUser with `username: 'vishwaAdmin'` exists
  - If NOT, hash password `'2004@vish#69'` with `bcryptjs.hash(..., 10)`, create document, log "Admin user created"
  - If YES, log "Admin user already exists"
  - Close connection and exit
  - Must be idempotent (safe to run multiple times)
- **Files:** `d:\Devlopment\portfolio\backend\scripts\seedAdmin.js`
- **Verify:** Run `node scripts/seedAdmin.js` (manually verify in step 10 or later)

### 10. Integration Test
- [ ] **What:** Verify backend build and basic connectivity. No full test suite yet; just confirm no syntax errors, no import failures, basic endpoints respond.
- **Files:** None modified
- **Verify:** 
  - Run `npm run dev` (or `npm start`) and confirm server starts without error
  - Curl or Postman: POST `http://localhost:5000/api/admin/login` with `{ "username": "vishwaAdmin", "password": "2004@vish#69" }` — expect 200 with JWT token
  - (If curl/Postman not available, proceed; full integration tested in frontend step)

---

## Frontend Implementation

All frontend files live in `d:\Devlopment\portfolio\frontend`.

### 11. Create Admin Login Page
- [ ] **What:** React component (page) at `src/pages/admin/LoginPage.jsx`. Features:
  - Form with username and password inputs
  - Submit button
  - POST to `/api/admin/login` with form data
  - On success (200): store JWT in `localStorage.setItem("adminToken", token)`, redirect to `/admin/dashboard`
  - On error (401/400): show error toast using `react-hot-toast` (already installed)
  - No auth guard on this route (public)
- **Files:** `d:\Devlopment\portfolio\frontend\src\pages\admin\LoginPage.jsx`
- **Verify:** Component file exists and exports default React component (structural check via grep). Full test in step 15.

### 12. Create Admin Auth Utility
- [ ] **What:** New utility file `src/utils/adminAuth.js` with functions:
  - `getAdminToken()`: return `localStorage.getItem("adminToken")`
  - `setAdminToken(token)`: `localStorage.setItem("adminToken", token)`
  - `clearAdminToken()`: `localStorage.removeItem("adminToken")`
  - `isAdminLoggedIn()`: return !!getAdminToken()
- **Files:** `d:\Devlopment\portfolio\frontend\src\utils\adminAuth.js`
- **Verify:** Structural check via grep.

### 13. Create Admin API Service
- [ ] **What:** New service file `src/services/adminService.js` with axios-based functions:
  - `loginAdmin(username, password)`: POST `/api/admin/login`, return response.data.token
  - `getAdminProjects()`: GET `/api/admin/projects`, with `Authorization: Bearer <token>` header
  - `createAdminProject(data)`: POST `/api/admin/projects`, with token header
  - `updateAdminProject(id, data)`: PUT `/api/admin/projects/:id`, with token header
  - `deleteAdminProject(id)`: DELETE `/api/admin/projects/:id`, with token header
  - `getAdminEducation()`: GET `/api/admin/education`, with token header
  - `createAdminEducation(data)`: POST `/api/admin/education`, with token header
  - `updateAdminEducation(id, data)`: PUT `/api/admin/education/:id`, with token header
  - `deleteAdminEducation(id)`: DELETE `/api/admin/education/:id`, with token header
  - All functions fetch token via `getAdminToken()` and add `Authorization` header. On 401, clear token and redirect to `/admin` (login).
- **Files:** `d:\Devlopment\portfolio\frontend\src/services/adminService.js`
- **Verify:** Structural check via grep.

### 14. Update AdminRoute Component
- [ ] **What:** Modify existing `src/components/adminRoute.jsx` to check `adminToken` instead of generic `token`. Logic:
  - Get `adminToken` from localStorage (not `token`)
  - If no token, redirect to `/admin` (login page, which does NOT require auth)
  - Otherwise, render Outlet
  - Simplify logic: admin auth is separate from regular user auth; do NOT check `isAdmin` flag on a User object.
- **Files:** `d:\Devlopment\portfolio\frontend\src/components/adminRoute.jsx` (modify)
- **Verify:** Component file is valid JSX (structural check).

### 15. Update App.jsx Routes
- [ ] **What:** Modify existing `src/App.jsx`:
  - Add new route for `/admin/login` → `<LoginPage />` (NOT protected by AdminRoute)
  - Wrap existing admin routes (Dashboard, Projects, Education, Messages) with `<AdminRoute>` as they already are
  - Update AdminLayout or Dashboard to use admin token from localStorage
- **Files:** `d:\Devlopment\portfolio\frontend\src/App.jsx` (modify)
- **Verify:** No TypeScript errors, component structure is valid.

### 16. Create/Update Admin Dashboard Page
- [ ] **What:** Verify or create `src/pages/admin/DashboardPage.jsx`. Must:
  - Display welcome message with admin username (retrieve from local state or JWT decode)
  - Show logout button (clears `adminToken`, redirects to `/admin/login`)
  - Simple layout with navigation tabs or links to Projects and Education pages
  - May be a simple card-based welcome page or a stub that exists (confirm it exists in codebase)
- **Files:** `d:\Devlopment\portfolio\frontend\src/pages/admin/DashboardPage.jsx`
- **Verify:** Component file is valid JSX.

### 17. Create Admin Projects Page
- [ ] **What:** React component `src/pages/admin/ProjectsPage.jsx` for CRUD. Features:
  - List all projects on load (GET `/api/admin/projects`)
  - Display projects in table or card grid with: title, category, status, actions (Edit, Delete)
  - Add Form (modal or inline): fields for title, slug, description, category, technologies, githubUrl, liveUrl, featured, status
  - Edit (modal): pre-fill form with project data, submit updates
  - Delete button with confirm dialog before DELETE request
  - Toast notifications for success/error (react-hot-toast)
- **Files:** `d:\Devlopment\portfolio\frontend\src/pages/admin/ProjectsPage.jsx`
- **Verify:** Component file is valid JSX and imports all dependencies.

### 18. Create Admin Education Page
- [ ] **What:** React component `src/pages/admin/EducationPage.jsx` for education CRUD. Features:
  - List all education on load (GET `/api/admin/education`)
  - Display in table or card grid: institution, degree, field, startYear, endYear, order
  - Add Form: fields for institution, degree, field, startYear, endYear (optional), description, order
  - Edit: pre-fill, submit updates
  - Delete with confirm
  - Toast notifications
  - Drag-to-reorder or manual order field update (optional; MVP: manual order field)
- **Files:** `d:\Devlopment\portfolio\frontend\src/pages/admin/EducationPage.jsx`
- **Verify:** Component file is valid JSX.

### 19. Update Admin Layout
- [ ] **What:** Verify or update `src/components/admin/AdminLayout.jsx`:
  - Check that it renders with navigation tabs/sidebar for Dashboard, Projects, Education
  - Logout button accessible from layout header
  - `<Outlet>` for nested routes
  - May already exist; if not, create a simple layout component
- **Files:** `d:\Devlopment\portfolio\frontend\src/components/admin/AdminLayout.jsx` (verify/modify)
- **Verify:** Component file is valid JSX.

### 20. Frontend Build and Test
- [ ] **What:** Build frontend and verify no errors.
- **Files:** None modified
- **Verify:** Run `npm run build` in `d:\Devlopment\portfolio\frontend`. Expect success (0 errors, artifacts in `dist/`).

---

## Integration and Verification

### 21. Full Backend + Frontend Integration Test
- [ ] **What:** Start backend server, start frontend dev server, test complete flow:
  - Navigate browser to `http://localhost:5173/admin` (or your frontend dev port)
  - Should redirect to `/admin/login` (not authenticated)
  - Submit login form with `username: vishwaAdmin`, `password: 2004@vish#69`
  - Should receive token and redirect to dashboard
  - Dashboard loads; logout button works
  - Projects tab: list, add, edit, delete projects
  - Education tab: list, add, edit, delete education
- **Files:** None modified
- **Verify:** 
  - Backend: `npm run dev` (or `npm start`), confirm starts on port 5000
  - Frontend: `npm run dev`, confirm starts on port 5173
  - Manual browser testing as above (no automated test suite required for MVP)

---

## Notes

- **Admin Auth is Separate**: AdminUser model is independent from the existing User model. The portfolio's regular user auth and admin auth do not share tokens or credentials.
- **No Existing Tests to Update**: The backend has no test suite (no jest, vitest, or mocha config). MVP does not include automated tests.
- **Frontend Already Has Stubs**: Pages and components for admin already exist (AdminLayout, DashboardPage, ProjectsPage, EducationPage). This plan fills them in and connects them to the backend.
- **Seed Script is Idempotent**: Can be run multiple times safely; only creates admin user if it doesn't exist.
- **JWT Expiry is 30 Days**: Matches the existing `generateToken` pattern.

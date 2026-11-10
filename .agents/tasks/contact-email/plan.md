# Implementation Plan: Contact Email Notifications and Message Management

## Overview
Add email notifications when users submit contact messages, enable admins to mark messages as read, and improve the contact message management UI in the admin panel.

---

## Backend Changes

### 1. Install nodemailer dependency
**What to do**: Add nodemailer package to the backend project dependencies.

**Files to modify**: 
- `d:\Devlopment\portfolio\backend\package.json`

**How to verify**: 
```
cd d:\Devlopment\portfolio\backend
npm install nodemailer
npm list nodemailer
```
Expected: nodemailer listed in dependencies with version >= 6.9.0.

---

### 2. Create email service with Gmail SMTP support
**What to do**: Create `d:\Devlopment\portfolio\backend\services\emailService.js` with a `sendContactEmail` function. 
This function sends an HTML email to `dev.vishwapramuditha@gmail.com` with the message details when a contact form is submitted. 
Use nodemailer with Gmail SMTP (smtp.gmail.com:587 with TLS). 
If email sending fails (network, auth, etc.), log the error and return `{ success: false, error: "..." }`. 
Do NOT throw an error — the message will still be saved to DB. Include an HTML email template with sender name, email, subject, and message body styled professionally.

**Files to create**: 
- `d:\Devlopment\portfolio\backend\services\emailService.js`

**How to verify**: 
```
node -c d:\Devlopment\portfolio\backend\services\emailService.js
```
Expected: No syntax errors. File can be imported without throwing.

---

### 3. Update messageController to call email service
**What to do**: Modify `createMessage` in `d:\Devlopment\portfolio\backend\controllers\messageController.js` to:
- Save the message to MongoDB (existing logic)
- After save, call `sendContactEmail(name, email, subject, message)` from the new emailService
- Catch email errors (if any) but still return 201 success response
- Email failure is non-blocking — user gets success message even if email fails

**Files to modify**: 
- `d:\Devlopment\portfolio\backend\controllers\messageController.js`

**How to verify**: 
```
npx eslint d:\Devlopment\portfolio\backend\controllers\messageController.js
```
Expected: No linting errors. File is syntactically valid ESM.

---

### 4. Add markAsRead controller function
**What to do**: Add a new `markAsRead` export to `d:\Devlopment\portfolio\backend\controllers\messageController.js`. 
Function signature: `export const markAsRead = async (req, res) => { ... }`
Find message by `req.params.id`, set `isRead = true`, save, return 200 with the updated message.
Handle errors gracefully (404 if message not found, 500 on DB error).

**Files to modify**: 
- `d:\Devlopment\portfolio\backend\controllers\messageController.js`

**How to verify**: 
```
npx eslint d:\Devlopment\portfolio\backend\controllers\messageController.js
```
Expected: No linting errors. New function present and exported.

---

### 5. Add markAsRead route to admin routes
**What to do**: Add `PUT /api/admin/messages/:id` route in `d:\Devlopment\portfolio\backend\routes\adminRoutes.js`. 
Import `markAsRead` from messageController and mount it at `router.put('/messages/:id', markAsRead)` under the protectAdmin middleware (all protected routes are already under it).

**Files to modify**: 
- `d:\Devlopment\portfolio\backend\routes\adminRoutes.js`

**How to verify**: 
```
npx eslint d:\Devlopment\portfolio\backend\routes\adminRoutes.js
```
Expected: No linting errors. File is syntactically valid ESM.

---

### 6. Add email environment variables
**What to do**: Append to `d:\Devlopment\portfolio\backend\.env` (do NOT overwrite existing values):
```
EMAIL_USER=dev.vishwapramuditha@gmail.com
EMAIL_PASSWORD=your_gmail_app_password_here
```
Add a comment above explaining the user must generate an App Password from https://myaccount.google.com/apppasswords (not the regular Gmail password).

**Files to modify**: 
- `d:\Devlopment\portfolio\backend\.env`

**How to verify**: 
```
cat d:\Devlopment\portfolio\backend\.env | grep -E "EMAIL_USER|EMAIL_PASSWORD"
```
Expected: Both EMAIL_USER and EMAIL_PASSWORD variables present.

---

## Frontend Changes

### 7. Add markAsRead function to adminService
**What to do**: Add `markAsRead` export to `d:\Devlopment\portfolio\frontend\src\services\adminService.js`. 
Function signature: `export const markAsRead = async (id) => { ... }`
Makes a `PUT /api/admin/messages/:id` request using the adminAPI instance (already authenticated via interceptor).
Returns the response data.

**Files to modify**: 
- `d:\Devlopment\portfolio\frontend\src\services\adminService.js`

**How to verify**: 
```
npx eslint d:\Devlopment\portfolio\frontend\src\services\adminService.js
```
Expected: No linting errors. File is syntactically valid ESM.

---

### 8. Update MessagesPage component with mark-as-read functionality
**What to do**: Update `d:\Devlopment\portfolio\frontend\src\pages\admin\MessagesPage.jsx` to:
- Import `markAsRead` from adminService
- In the selected message detail view, add a "Mark as Read" button below or near the delete button
- Display read/unread status as a badge (e.g., "NEW" in blue if isRead === false, "READ" in gray if isRead === true)
- When user clicks "Mark as Read", call `markAsRead(id)`, update the message's isRead status in state, show toast success/error
- Add unread count badge in the messages list header (e.g., "Messages (3 unread)" or similar)
- Sort messages to show unread first, then read by newest date

**Files to modify**: 
- `d:\Devlopment\portfolio\frontend\src\pages\admin\MessagesPage.jsx`

**How to verify**: 
```
npx eslint d:\Devlopment\portfolio\frontend\src\pages\admin\MessagesPage.jsx
```
Expected: No linting errors. File is syntactically valid JSX/ESM.

---

## Integration and Verification

### 9. Run backend build and check for errors
**What to do**: Start the backend server and verify all routes and middleware work correctly with no console errors.

**Files**: All backend files modified above.

**How to verify**: 
```
cd d:\Devlopment\portfolio\backend
npm run dev
# Check console for:
# - "Server running on port 5000"
# - No import/syntax errors
# - No middleware errors
```
Expected: Server starts successfully, listens on port 5000, no error logs about imports or syntax.

---

### 10. Run frontend build and check for errors
**What to do**: Build the frontend to ensure all changes are syntactically valid and compatible with the existing setup.

**Files**: All frontend files modified above.

**How to verify**: 
```
cd d:\Devlopment\portfolio\frontend
npm run build
```
Expected: Build completes successfully with no errors or critical warnings. dist/ folder is created.

---

## Summary

- **Backend**: Email service + updated message controller + markAsRead endpoint + .env config
- **Frontend**: Admin service helper + MessagesPage enhancements (mark as read, read/unread badge, unread count)
- **Contact flow**: User submits form → message saved to DB + email sent to dev.vishwapramuditha@gmail.com → admin sees in Messages panel → admin can mark read/delete
- **Non-blocking email**: If email fails, message is still saved and user gets success response

---
id: TASK-4
title: 'Task 0.1.3: [Frontend] Google Sign-in UI and Initiation'
status: Done
assignee: []
created_date: '2026-03-28 07:16'
updated_date: '2026-03-28 11:46'
labels:
  - frontend
  - auth
dependencies:
  - TASK-9.2.5
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Context & Goal:** 
Now that the backend can issue secure sessions, the frontend needs an entry point. We will create a clean, modern landing page with a Google Sign-In button that redirects to the backend auth flow.

**Technical Details:**
1. Open `frontend/src/pages/LandingPage.tsx`.
2. Add a prominent, styled "Sign in with Google" button. 
3. When clicked, redirect the browser window to the backend `GET /auth/google` endpoint (which in turn redirects to the Google consent screen).
4. Extract the Google Client ID config if utilizing client-side SDK, though Server-Side redirect is preferred for better security (BFF - Backend for Frontend pattern).

**Architectural Principle:**
- **Separation of Concerns:** The UI component should only be responsible for the presentation and user interaction, remaining entirely ignorant of the underlying OAuth cryptographic exchange.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Frontend components display a "Sign in with Google" button when no valid session exists.
- [x] #2 The login button triggers a redirect to the backend's `/auth/google` route to initiate the OAuth flow.
<!-- AC:END -->

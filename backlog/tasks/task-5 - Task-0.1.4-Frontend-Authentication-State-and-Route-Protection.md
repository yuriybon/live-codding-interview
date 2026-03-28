---
id: TASK-5
title: 'Task 0.1.4: [Frontend] Authentication State and Route Protection'
status: To Do
assignee: []
created_date: '2026-03-28 07:17'
updated_date: '2026-03-28 07:20'
labels:
  - frontend
  - auth
  - routing
dependencies:
  - TASK-4
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Context & Goal:** 
The application must maintain an awareness of the user's logged-in state across page reloads and protect the actual "Interview Room" from unauthorized access.

**Technical Details:**
1. Modify `frontend/src/store/authStore.ts` (create if missing) using Zustand to track `{ isAuthenticated: boolean, user: UserProfile | null }`.
2. Implement a `checkAuth` action that validates the HTTP-only cookie or JWT on app load.
3. Wrap the `InterviewRoom.tsx` in a `<ProtectedRoute>` component. If `isAuthenticated` is false, redirect to `LandingPage.tsx`.
4. Ensure the navigation bar displays the user's Google avatar.

**Architectural Principle:**
- **State Centralization:** Auth state is a global concern and should be decoupled from local component state to prevent "prop drilling" and ensure consistent security enforcement across all routes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Frontend Zustand store correctly manages user authentication state (logged in, user profile data).
- [ ] #2 Protected routes (like the Interview Room) redirect to the login page if the user is not authenticated.
<!-- AC:END -->

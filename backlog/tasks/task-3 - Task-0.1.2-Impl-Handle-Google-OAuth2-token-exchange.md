---
id: TASK-3
title: 'Task 0.1.2: [Impl] Handle Google OAuth2 token exchange'
status: To Do
assignee: []
created_date: '2026-03-28 07:16'
updated_date: '2026-03-28 07:20'
labels:
  - tdd-impl
  - auth
dependencies:
  - TASK-2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**TDD Phase: Green (Implementation)**

**Context & Goal:** 
Implement the actual OAuth2 token exchange logic to pass the previously written failing test, establishing the authentication boundary for the application.

**Technical Details:**
1. Update `src/server/routes/auth.ts` (or create it) to define the `GET /auth/google/callback` endpoint.
2. Instantiate `OAuth2Client` using `GCP_PROJECT_ID`, Client ID, and Client Secret.
3. Call `client.getToken(code)` and `client.verifyIdToken()` to extract the user's `email`, `name`, and `picture`.
4. Create an ephemeral session (e.g., JWT or secure HTTP-only cookie) representing the authenticated user.
5. Redirect the user back to the frontend dashboard on success.
6. Run the test suite to ensure the failure case (TASK-2) and the new success case both pass.

**Architectural Principle:**
- **Single Responsibility Principle (SRP):** The route should only handle the HTTP and OAuth mechanics. Delegate user creation/session storage to an `AuthService`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Express route `/auth/google/callback` correctly uses `OAuth2Client` to exchange an authorization code for an ID token and access token, passing the failure test when misconfigured and a new success test when configured properly.
- [ ] #2 The user's email and profile picture are extracted from the token payload.
<!-- AC:END -->

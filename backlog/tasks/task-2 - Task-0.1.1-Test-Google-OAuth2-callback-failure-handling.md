---
id: TASK-2
title: 'Task 0.1.1: [Test] Google OAuth2 callback failure handling'
status: To Do
assignee: []
created_date: '2026-03-28 07:16'
updated_date: '2026-03-28 07:20'
labels:
  - tdd-test
  - auth
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**TDD Phase: Red (Test First)**

**Context & Goal:** 
Before implementing the Google OAuth2 flow, we must ensure the system handles misconfigurations and invalid authorization codes securely. This adheres to defensive programming principles.

**Technical Details:**
1. Navigate to the backend test suite (e.g., `src/server/__tests__/routes/auth.test.ts`).
2. Write a unit test targeting `GET /auth/google/callback`.
3. Mock the `google-auth-library` `OAuth2Client.getToken()` method to reject with a standard error (e.g., "invalid_grant").
4. Assert that the Express route catches this error, does not crash the server, and returns an appropriate HTTP 401 Unauthorized or 500 Internal Server Error response, ideally redirecting the user back to the frontend with an error query parameter.

**Architectural Principle:**
- **Fail-Fast & Secure:** Ensures unauthenticated or malicious attempts to hit the callback route are handled safely before state is modified.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A failing test exists asserting that `OAuth2Client` throws an error when exchanging a valid authorization code for tokens if the backend is not configured properly.
<!-- AC:END -->

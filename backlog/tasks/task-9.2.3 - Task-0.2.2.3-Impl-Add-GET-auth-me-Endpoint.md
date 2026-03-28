---
id: TASK-9.2.3
title: 'Task 0.2.2.3: [Impl] Add GET /auth/me Endpoint'
status: Done
assignee: []
created_date: '2026-03-28 11:04'
updated_date: '2026-03-28 11:20'
labels:
  - tdd-impl
  - auth
  - api
dependencies:
  - TASK-9.2.2
parent_task_id: TASK-9.2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add GET /auth/me endpoint that returns the current authenticated user's profile from the session, or returns null if not authenticated. This allows frontend to check auth status on app load.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Endpoint GET /auth/me returns JSON with user profile when authenticated or {user: null} when not authenticated
<!-- AC:END -->

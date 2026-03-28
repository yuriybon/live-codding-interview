---
id: TASK-9.3.4
title: 'Task 0.2.3.4: [Impl] Migrate Auth Routes to Use cookie-session'
status: Done
assignee: []
created_date: '2026-03-28 11:06'
updated_date: '2026-03-28 11:21'
labels:
  - tdd-impl
  - session
  - auth
dependencies:
  - TASK-9.3.3
parent_task_id: TASK-9.3
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update /auth/google/callback to store user profile in req.session.user instead of generating JWT tokens, and remove JWT-based cookie setting logic.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 OAuth callback stores user data in req.session.user object instead of setting JWT cookie
<!-- AC:END -->

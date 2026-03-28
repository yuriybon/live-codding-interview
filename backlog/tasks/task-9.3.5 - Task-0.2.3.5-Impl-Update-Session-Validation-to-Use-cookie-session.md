---
id: TASK-9.3.5
title: 'Task 0.2.3.5: [Impl] Update Session Validation to Use cookie-session'
status: Done
assignee: []
created_date: '2026-03-28 11:06'
updated_date: '2026-03-28 11:21'
labels:
  - tdd-impl
  - session
  - middleware
dependencies:
  - TASK-9.3.4
parent_task_id: TASK-9.3
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update session validation middleware to read user data from req.session.user instead of verifying JWT tokens, simplifying authentication logic.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Middleware reads req.session.user directly without JWT verification and attaches to req.user for protected routes
<!-- AC:END -->

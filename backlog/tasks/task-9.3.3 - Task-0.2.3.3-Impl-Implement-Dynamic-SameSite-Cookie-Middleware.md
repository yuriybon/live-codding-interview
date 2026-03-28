---
id: TASK-9.3.3
title: 'Task 0.2.3.3: [Impl] Implement Dynamic SameSite Cookie Middleware'
status: Done
assignee: []
created_date: '2026-03-28 11:06'
updated_date: '2026-03-28 11:21'
labels:
  - tdd-impl
  - session
  - security
dependencies:
  - TASK-9.3.2
parent_task_id: TASK-9.3
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement middleware that dynamically configures cookie-session with appropriate SameSite value based on environment (lax for localhost, none for iframe/production) and sets secure, httpOnly, signed, and partitioned flags.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Middleware detects iframe context and sets SameSite='none' with partitioned=true for production, or SameSite='lax' for localhost/direct access
<!-- AC:END -->

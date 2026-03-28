---
id: TASK-9.2.5
title: 'Task 0.2.2.5: [Impl] Add GET /auth/google/url Endpoint'
status: Done
assignee: []
created_date: '2026-03-28 11:05'
updated_date: '2026-03-28 11:20'
labels:
  - tdd-impl
  - auth
  - api
  - oauth
dependencies:
  - TASK-9.2.4
parent_task_id: TASK-9.2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add GET /auth/google/url endpoint that generates and returns the OAuth authorization URL, allowing frontend to initiate auth flow via API call instead of direct redirect.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Endpoint GET /auth/google/url returns JSON {url: string} containing the Google OAuth authorization URL
<!-- AC:END -->

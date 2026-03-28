---
id: TASK-9.4.2
title: 'Task 0.2.4.2: [Impl] Implement Dynamic Redirect URI Function'
status: Done
assignee: []
created_date: '2026-03-28 11:07'
updated_date: '2026-03-28 11:22'
labels:
  - tdd-impl
  - configuration
  - oauth
dependencies:
  - TASK-9.4.1
parent_task_id: TASK-9.4
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create getRedirectUri(req?) function that determines the OAuth redirect URI dynamically: uses APP_URL if set, otherwise detects from X-Forwarded-Proto and Host headers, falling back to localhost.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Function getRedirectUri returns correct callback URL based on APP_URL env var or request headers (protocol + host + /auth/google/callback)
<!-- AC:END -->

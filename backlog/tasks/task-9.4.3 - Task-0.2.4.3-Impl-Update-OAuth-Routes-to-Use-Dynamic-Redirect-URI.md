---
id: TASK-9.4.3
title: 'Task 0.2.4.3: [Impl] Update OAuth Routes to Use Dynamic Redirect URI'
status: Done
assignee: []
created_date: '2026-03-28 11:07'
updated_date: '2026-03-28 11:22'
labels:
  - tdd-impl
  - oauth
  - configuration
dependencies:
  - TASK-9.4.2
parent_task_id: TASK-9.4
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update both /auth/google and /auth/google/callback endpoints to use getRedirectUri(req) instead of static env.GOOGLE_REDIRECT_URI, enabling proper OAuth flow across environments.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Both OAuth endpoints use getRedirectUri(req) and log the redirect URI being used for debugging purposes
<!-- AC:END -->

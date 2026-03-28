---
id: TASK-9.4.1
title: 'Task 0.2.4.1: [Impl] Add APP_URL Environment Variable'
status: Done
assignee: []
created_date: '2026-03-28 11:07'
updated_date: '2026-03-28 11:19'
labels:
  - tdd-impl
  - configuration
  - env
dependencies: []
parent_task_id: TASK-9.4
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add APP_URL to environment configuration in src/server/config/env.ts as an optional variable that overrides dynamic URL detection when set.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Environment variable APP_URL is defined in env.ts and defaults to undefined/empty string when not set
<!-- AC:END -->

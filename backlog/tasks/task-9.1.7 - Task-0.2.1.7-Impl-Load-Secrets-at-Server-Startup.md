---
id: TASK-9.1.7
title: 'Task 0.2.1.7: [Impl] Load Secrets at Server Startup'
status: Done
assignee: []
created_date: '2026-03-28 11:03'
updated_date: '2026-03-28 11:20'
labels:
  - tdd-impl
  - secret-manager
  - startup
dependencies:
  - TASK-9.1.6
parent_task_id: TASK-9.1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Modify server startup in index.ts to asynchronously load all required secrets (GEMINI_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET/SESSION_SECRET) before starting the HTTP server.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Server startup function is async and loads all four secrets with console output showing which source each secret was loaded from
<!-- AC:END -->

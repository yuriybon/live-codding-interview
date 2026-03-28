---
id: TASK-12.6
title: 'Task 12.6: [Test] End-to-end LLM interaction smoke test'
status: To Do
assignee: []
created_date: '2026-03-28 13:51'
labels:
  - test
  - backend
  - frontend
  - websocket
dependencies:
  - TASK-12.3
  - TASK-12.4
  - TASK-12.5
parent_task_id: TASK-12
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add an automated smoke path that verifies a user can connect, send one valid input payload, and receive one model-originated response event through the websocket bridge.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A repeatable smoke test passes by proving one complete request/response loop across frontend message format, backend relay, and frontend response handling.
<!-- AC:END -->

---
id: TASK-12.7
title: 'Task 12.7: [Ops] Add websocket diagnostics and failure telemetry'
status: To Do
assignee: []
created_date: '2026-03-28 13:52'
labels:
  - backend
  - frontend
  - websocket
  - ops
dependencies:
  - TASK-12.3
  - TASK-12.4
parent_task_id: TASK-12
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add structured diagnostics for websocket lifecycle and relay errors so teams can quickly identify whether failures occur on client payload, backend routing, or provider response handling.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Connection lifecycle and relay failure reasons are logged with correlation identifiers that allow tracing one session across client and server logs.
<!-- AC:END -->

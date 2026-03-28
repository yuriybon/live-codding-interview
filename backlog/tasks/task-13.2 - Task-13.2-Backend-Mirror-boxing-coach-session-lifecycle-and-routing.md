---
id: TASK-13.2
title: 'Task 13.2: [Backend] Mirror boxing-coach session lifecycle and routing'
status: To Do
assignee: []
created_date: '2026-03-28 14:19'
labels:
  - backend
  - websocket
  - parity
dependencies:
  - TASK-12.1
  - TASK-12.4
references:
  - ../boxing-coach/server.ts
  - ../boxing-coach/src/server/sessionManager.ts
parent_task_id: TASK-13
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Align backend websocket lifecycle with boxing-coach pattern: deterministic client registration, explicit session start/config gating, relay routing, and graceful teardown semantics.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Backend session lifecycle and routing behavior matches the documented boxing-coach flow for connect, start-session, relay, interruption, and close.
<!-- AC:END -->

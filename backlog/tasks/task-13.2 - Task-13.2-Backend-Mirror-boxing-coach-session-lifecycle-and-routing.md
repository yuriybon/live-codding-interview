---
id: TASK-13.2
title: 'Task 13.2: [Backend] Mirror boxing-coach session lifecycle and routing'
status: Done
assignee: []
created_date: '2026-03-28 14:19'
updated_date: '2026-03-28 15:59'
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
- [x] #1 Backend session lifecycle and routing behavior matches the documented boxing-coach flow for connect, start-session, relay, interruption, and close.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented backend lifecycle/routing parity increments: explicit start_session handling (session_started event), boxing-coach style realtime_input relay, tool_response relay to Gemini, deterministic join/start state tracking, and per-session graceful teardown. Added dedicated lifecycle/relay tests in src/server/__tests__/services/websocket.test.ts.
<!-- SECTION:NOTES:END -->

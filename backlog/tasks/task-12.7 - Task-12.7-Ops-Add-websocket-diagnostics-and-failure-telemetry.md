---
id: TASK-12.7
title: 'Task 12.7: [Ops] Add websocket diagnostics and failure telemetry'
status: Done
assignee: []
created_date: '2026-03-28 13:52'
updated_date: '2026-03-28 16:25'
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
- [x] #1 Connection lifecycle and relay failure reasons are logged with correlation identifiers that allow tracing one session across client and server logs.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented structured websocket diagnostics with correlationId tracing across client/server/provider flows. Added WS_DIAG (server) and WS_CLIENT_DIAG (client) logs for lifecycle, relay forwarding, and failure reasons (client_payload/backend_routing/provider_response). Added correlationId field to shared websocket contract BaseMessage and propagated ids on server responses/broadcasts. Verified with websocket unit/e2e tests plus frontend/backend builds.
<!-- SECTION:NOTES:END -->

---
id: TASK-12.1
title: 'Task 12.1: [Backend] Register WebSocket clients and join-session handshake'
status: To Do
assignee: []
created_date: '2026-03-28 13:51'
labels:
  - backend
  - websocket
dependencies:
  - TASK-1.2.4
parent_task_id: TASK-12
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ensure every new socket is tracked with initial client state and transitions cleanly after join_session so message handling no longer rejects valid clients as unauthenticated.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A connected client that sends a valid join_session message is accepted and no longer receives Not authenticated errors during normal flow.
<!-- AC:END -->

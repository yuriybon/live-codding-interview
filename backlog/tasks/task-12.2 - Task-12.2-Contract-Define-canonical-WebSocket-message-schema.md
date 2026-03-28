---
id: TASK-12.2
title: 'Task 12.2: [Contract] Define canonical WebSocket message schema'
status: Done
assignee: []
created_date: '2026-03-28 13:51'
updated_date: '2026-03-28 15:05'
labels:
  - backend
  - frontend
  - websocket
dependencies:
  - TASK-12.1
references:
  - >-
    backlog/docs/doc-4 -
    Single-Page-Realtime-Architecture-and-WebSocket-Contract.md
parent_task_id: TASK-12
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Define and publish one canonical schema for inbound/outbound websocket messages covering join, audio, video, text, tool-calls, errors, and Gemini relay responses.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A single versioned contract document exists and is referenced by both frontend and backend tasks for payload validation and implementation.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created doc-4 as the canonical single-page architecture and websocket contract (v1) for frontend/backend alignment.
<!-- SECTION:NOTES:END -->

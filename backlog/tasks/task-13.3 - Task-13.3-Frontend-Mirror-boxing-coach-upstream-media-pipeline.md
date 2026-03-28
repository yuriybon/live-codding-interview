---
id: TASK-13.3
title: 'Task 13.3: [Frontend] Mirror boxing-coach upstream media pipeline'
status: To Do
assignee: []
created_date: '2026-03-28 14:19'
labels:
  - frontend
  - websocket
  - parity
  - audio
  - video
dependencies:
  - TASK-12.3
references:
  - ../boxing-coach/src/lib/useGeminiLive.ts
  - ../boxing-coach/src/components/Training.tsx
parent_task_id: TASK-13
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Align frontend capture and send path with boxing-coach semantics for 16k PCM audio chunks and periodic JPEG frame uploads over realtime_input messages.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Frontend upstream media stream shape and cadence match the parity checklist and produce stable bidirectional streaming without burst backlog.
<!-- AC:END -->

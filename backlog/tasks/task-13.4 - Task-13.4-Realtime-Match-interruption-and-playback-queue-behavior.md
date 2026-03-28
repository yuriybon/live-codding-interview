---
id: TASK-13.4
title: 'Task 13.4: [Realtime] Match interruption and playback queue behavior'
status: To Do
assignee: []
created_date: '2026-03-28 14:19'
labels:
  - frontend
  - backend
  - audio
  - parity
dependencies:
  - TASK-12.4
  - TASK-12.5
references:
  - ../boxing-coach/src/server/sessionManager.ts
  - ../boxing-coach/src/lib/useGeminiLive.ts
parent_task_id: TASK-13
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement interruption semantics equivalent to boxing-coach so user speech can preempt model audio quickly and playback queue state is reset safely.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 When interruption events occur, active AI playback is cleared and resumed without overlapping audio artifacts or long delay carryover.
<!-- AC:END -->

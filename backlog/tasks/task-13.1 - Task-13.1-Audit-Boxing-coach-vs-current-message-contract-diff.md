---
id: TASK-13.1
title: 'Task 13.1: [Audit] Boxing-coach vs current message contract diff'
status: To Do
assignee: []
created_date: '2026-03-28 14:19'
labels:
  - websocket
  - parity
  - audit
dependencies:
  - TASK-12.2
references:
  - ../boxing-coach/src/lib/useGeminiLive.ts
  - ../boxing-coach/src/server/sessionManager.ts
parent_task_id: TASK-13
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Produce a field-by-field diff between boxing-coach and current websocket payloads for start session, realtime media input, model output, interruption, and tool calls.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A single contract-diff artifact exists and each mismatch is mapped to an owning implementation task.
<!-- AC:END -->

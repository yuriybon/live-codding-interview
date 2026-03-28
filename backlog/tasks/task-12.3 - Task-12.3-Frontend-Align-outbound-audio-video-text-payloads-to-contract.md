---
id: TASK-12.3
title: 'Task 12.3: [Frontend] Align outbound audio/video/text payloads to contract'
status: To Do
assignee: []
created_date: '2026-03-28 13:51'
labels:
  - frontend
  - websocket
dependencies:
  - TASK-12.2
  - TASK-1.3.2
  - TASK-1.3.6
parent_task_id: TASK-12
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update client-side outbound websocket messages so microphone audio, screen frames, and editor/text context follow the canonical contract expected by the backend bridge.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Frontend outbound websocket payloads for audio/video/text validate against the canonical schema and are accepted by the backend without fallback parsing.
<!-- AC:END -->

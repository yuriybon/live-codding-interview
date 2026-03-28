---
id: TASK-12.4
title: 'Task 12.4: [Backend] Normalize Gemini relay output events for frontend'
status: To Do
assignee: []
created_date: '2026-03-28 13:51'
labels:
  - backend
  - websocket
  - llm
dependencies:
  - TASK-12.2
parent_task_id: TASK-12
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Transform raw Gemini Live messages into stable app-level websocket event types so the frontend can consume model text, audio chunks, interruptions, and tool-call payloads deterministically.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Backend emits documented app-level response events that map model output into predictable payloads without exposing raw provider-specific structures to the UI.
<!-- AC:END -->

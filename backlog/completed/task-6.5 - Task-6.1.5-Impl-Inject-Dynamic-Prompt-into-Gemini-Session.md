---
id: TASK-6.5
title: 'Task 6.1.5: [Impl] Inject Dynamic Prompt into Gemini Session'
status: Done
assignee: []
created_date: '2026-03-28 07:42'
updated_date: '2026-03-28 15:51'
labels:
  - backend
  - websocket
dependencies:
  - TASK-6.4
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Integration**\nEnsure that the dynamically generated System Prompt is correctly passed down into the `sessionConfig` of the Gemini Multimodal Live API stream when the WebSocket bridge is established.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 When a WebSocket connects to a specific `sessionId`, the `GeminiLiveClient` is initialized with the `PromptFactory.generate(config)` output rather than the static `process.env.GEMINI_SYSTEM_PROMPT`.
<!-- AC:END -->

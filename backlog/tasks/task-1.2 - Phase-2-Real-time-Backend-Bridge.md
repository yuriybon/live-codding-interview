---
id: TASK-1.2
title: 'Phase 2: Real-time Backend Bridge'
status: To Do
assignee: []
created_date: '2026-03-28 07:04'
labels:
  - backend
  - websocket
dependencies:
  - TASK-1.1
parent_task_id: TASK-1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the bidirectional WebSocket bridge on the Node.js backend to facilitate direct, low-latency communication between the React frontend and the Gemini Multimodal Live API. This relay will handle both JSON control messages and raw binary data.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 WebSocket bridge in `websocket.ts` established between client and Gemini Live API (Vertex AI)
- [ ] #2 Client JSON/Binary messages are piped to Gemini Live API correctly
- [ ] #3 AI JSON/Binary messages are piped back to the client correctly
- [ ] #4 Initial session configuration message (system prompt, voice selection) is sent on connect
<!-- AC:END -->

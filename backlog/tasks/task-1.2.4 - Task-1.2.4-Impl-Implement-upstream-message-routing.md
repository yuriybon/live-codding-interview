---
id: TASK-1.2.4
title: 'Task 1.2.4: [Impl] Implement upstream message routing'
status: To Do
assignee: []
created_date: '2026-03-28 07:08'
updated_date: '2026-03-28 07:22'
labels:
  - tdd-impl
  - backend
dependencies:
  - TASK-1.2.3
parent_task_id: TASK-1.2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**TDD Phase: Green (Implementation)**

**Context & Goal:** 
Implement the upstream relay logic. The backend acts as a low-latency proxy.

**Technical Details:**
1. Update `src/server/services/websocket.ts`.
2. When a client connects and joins a session, instantiate or bind a `GeminiLiveClient`.
3. In the `ws.on('message')` handler, distinguish between generic app control messages (like 'join_session') and actual Realtime stream payloads.
4. Forward the Realtime stream payloads (raw PCM base64 or editor text diffs) directly to `geminiLiveClient.send()`.
5. Ensure error handling is robust (e.g., if the Gemini socket drops, cleanly notify the client).

**Architectural Principle:**
- **Single Responsibility Principle:** The WebSocket bridge just relays; it doesn't parse or attempt to "understand" the AI's audio chunks.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Upstream messages are correctly piped from the local WebSocket server to the Gemini Live API stream, passing the upstream routing test.
<!-- AC:END -->

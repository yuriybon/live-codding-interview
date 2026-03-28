---
id: TASK-1.2.3
title: 'Task 1.2.3: [Test] Upstream message routing'
status: Done
assignee: []
created_date: '2026-03-28 07:08'
updated_date: '2026-03-28 12:18'
labels:
  - tdd-test
  - backend
dependencies:
  - TASK-1.2.2
parent_task_id: TASK-1.2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**TDD Phase: Red (Test First)**

**Context & Goal:** 
We need to ensure that raw PCM16 audio and tool calls sent by the React frontend are safely and correctly piped from the backend WebSocket server directly into the Gemini Live WebSocket.

**Technical Details:**
1. In `src/server/__tests__/services/websocket.test.ts`, write a new test.
2. Simulate a client sending a valid JSON or Binary payload (simulating audio/editor updates).
3. Assert that the `WebSocketService` correctly routes this payload to the `GeminiLiveClient`'s `.send()` method without mangling or dropping the data.

**Architectural Principle:**
- **Adapter Pattern:** The `WebSocketService` acts as an adapter bridging the incoming client socket to the outgoing Gemini socket.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A unit test asserts that when the `ClientBridge` receives a payload from the React frontend, it correctly routes it unmodified to the `GeminiLiveClient` WebSocket.
<!-- AC:END -->

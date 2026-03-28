---
id: TASK-12.6
title: 'Task 12.6: [Test] End-to-end LLM interaction smoke test'
status: Done
assignee: []
created_date: '2026-03-28 13:51'
updated_date: '2026-03-28 16:10'
labels:
  - test
  - backend
  - frontend
  - websocket
dependencies:
  - TASK-12.3
  - TASK-12.4
  - TASK-12.5
parent_task_id: TASK-12
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add an automated smoke path that verifies a user can connect, send one valid input payload, and receive one model-originated response event through the websocket bridge.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A repeatable smoke test passes by proving one complete request/response loop across frontend message format, backend relay, and frontend response handling.
<!-- AC:END -->

## Implementation Summary

<!-- SECTION:IMPLEMENTATION:BEGIN -->
Created comprehensive end-to-end smoke test suite at `src/server/__tests__/services/websocket-e2e.test.ts` that validates the complete WebSocket message flow from client to Gemini and back.

**Test Coverage:**
1. **Complete Request/Response Loop** - Validates full flow:
   - Client connection
   - Session join (join_session → session_joined)
   - Session start (start_session → session_started)
   - Audio input relay (realtime_input → Gemini sendAudio)
   - Gemini response normalization (Gemini message → model_text, model_audio, feedback)

2. **Video Frame Input** - Verifies video frame handling:
   - realtime_input with image/jpeg → Gemini sendVideoFrame

3. **Interruption Handling** - Tests interruption flow:
   - Gemini interrupted event → model_interruption broadcast

4. **Tool Response Relay** - Validates tool response handling:
   - tool_response message → Gemini sendToolResponse

**Key Implementation Details:**
- Mocked WebSocketServer to prevent port conflicts during test execution
- Injected mock GeminiLiveClient with event handlers for message normalization
- Simulated client connections using EventEmitter-based mocks
- Verified complete message transformation pipeline from raw input to normalized output
- All 4 test cases passing

**Files Created:**
- `src/server/__tests__/services/websocket-e2e.test.ts` (378 lines)

**Test Results:**
```
Test Suites: 1 passed
Tests:       4 passed
```
<!-- SECTION:IMPLEMENTATION:END -->

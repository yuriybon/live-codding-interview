---
id: TASK-1.2.1
title: 'Task 1.2.1: [Test] GeminiLiveClient connection initialization'
status: To Do
assignee: []
created_date: '2026-03-28 07:08'
updated_date: '2026-03-28 07:22'
labels:
  - tdd-test
  - backend
dependencies:
  - TASK-1.1.4
parent_task_id: TASK-1.2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**TDD Phase: Red (Test First)**

**Context & Goal:** 
The backend must connect directly to the Gemini Multimodal Live API via WebSockets. This requires a new dedicated service class (`GeminiLiveClient`) that handles the Google Authentication handshake and sets up the WebSocket connection to Vertex AI.

**Technical Details:**
1. Create `src/server/__tests__/services/gemini-live.test.ts`.
2. Mock `GoogleAuth` from `google-auth-library` and the `ws` module.
3. Write a test asserting that instantiating `GeminiLiveClient.connect()` attempts to fetch an access token and opens a WebSocket to `wss://${GCP_LOCATION}-aiplatform.googleapis.com/...`.

**Architectural Principle:**
- **Dependency Inversion Principle (DIP):** Depend on abstractions (the WebSocket interface) rather than concrete implementations to allow mock testing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A failing unit test exists asserting that a new `GeminiLiveClient` class initiates a secure WebSocket connection to the Vertex AI endpoints using valid Google Auth credentials.
<!-- AC:END -->

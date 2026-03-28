---
id: TASK-1.2.2
title: 'Task 1.2.2: [Impl] Establish Vertex AI WebSocket Connection'
status: Done
assignee: []
created_date: '2026-03-28 07:08'
updated_date: '2026-03-28 12:17'
labels:
  - tdd-impl
  - backend
dependencies:
  - TASK-1.2.1
parent_task_id: TASK-1.2
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**TDD Phase: Green (Implementation)**

**Context & Goal:** 
Implement the `GeminiLiveClient` to pass the connection initialization test.

**Technical Details:**
1. Create `src/server/services/gemini-live.ts`.
2. Implement Google Application Default Credentials (ADC) to fetch a Bearer token.
3. Construct the Vertex AI WebSocket URL using `env.GCP_PROJECT_ID`, `env.GCP_LOCATION`, and `env.GEMINI_REALTIME_MODEL`.
4. Open the connection and send the initial `setup` message containing the system instructions: "You are a senior tech interviewer...", voice configurations, and the `setup_coding_task` Tool Declaration.

**Architectural Principle:**
- **Encapsulation:** The complex Google Cloud URL construction and bearer token management is hidden entirely within this client class.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `GeminiLiveClient` successfully authenticates and opens a WebSocket to Vertex AI, passing the test from 1.2.1.
<!-- AC:END -->

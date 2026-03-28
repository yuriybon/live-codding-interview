---
id: TASK-1.5.2
title: 'Task 1.5.2: [Impl] Zustand Store Tool Calling & Editor Updates'
status: To Do
assignee: []
created_date: '2026-03-28 07:27'
labels:
  - tdd-impl
  - frontend
  - store
dependencies:
  - TASK-1.5.1
parent_task_id: TASK-1.5
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**TDD Phase: Green (Implementation)**

**Context & Goal:** 
Implement the Tool Call bridge that allows the AI to inject starter code and descriptions into the UI dynamically.

**Technical Details:**
1. Update `frontend/src/store/interviewStore.ts` to implement the `handleToolCall` method to pass the unit test.
2. In `frontend/src/services/websocketClient.ts`, intercept incoming `functionCall` objects from the Gemini Realtime stream.
3. Automatically reply to the Gemini Live API with a `functionResponse` to acknowledge that the tool was executed, preventing the AI from stalling.

**Architectural Principle:**
- **Agentic UI:** The UI is an extension of the AI's physical capabilities.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The `useInterviewStore` successfully updates its state when processing a `setup_coding_task` tool call from the Gemini WebSocket.
- [ ] #2 The Monaco editor immediately reflects the `language` and `starterCode` provided by the AI.
<!-- AC:END -->

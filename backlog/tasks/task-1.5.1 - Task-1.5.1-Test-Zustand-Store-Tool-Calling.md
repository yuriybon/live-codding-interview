---
id: TASK-1.5.1
title: 'Task 1.5.1: [Test] Zustand Store Tool Calling'
status: To Do
assignee: []
created_date: '2026-03-28 07:27'
labels:
  - tdd-test
  - frontend
  - store
dependencies:
  - TASK-1.4.2
parent_task_id: TASK-1.5
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**TDD Phase: Red (Test First)**

**Context & Goal:** 
The magic of the AI interviewer is that it can manipulate the code editor using Gemini Tool Calls. We must test that the state management correctly responds to these calls.

**Technical Details:**
1. Create `frontend/src/__tests__/store/interviewStore.test.ts`.
2. Mock a simulated WebSocket payload containing a `functionCall` named `setup_coding_task` with `{ language: "java", starterCode: "class Solution {}" }`.
3. Assert that calling `store.handleToolCall(payload)` correctly updates the store's current `language` and `code` state.

**Architectural Principle:**
- **State-Driven UI:** The code editor must strictly reflect the Zustand store; it should not manage its own state independently of the AI's commands.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A failing unit test exists asserting that `useInterviewStore` updates the `code` and `language` state when a `functionCall` event for `setup_coding_task` is dispatched.
<!-- AC:END -->

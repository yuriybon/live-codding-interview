---
id: TASK-1.3.3
title: 'Task 1.3.3: [Test] Editor Context Syncing'
status: Done
assignee: []
created_date: '2026-03-28 07:23'
updated_date: '2026-03-28 14:46'
labels:
  - tdd-test
  - frontend
  - editor
dependencies:
  - TASK-1.3.2
parent_task_id: TASK-1.3
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**TDD Phase: Red (Test First)**

**Context & Goal:** 
The AI needs to "see" the candidate's code. Sending base64 video frames of the editor is heavy and slow. Sending raw text diffs as `clientContent` messages is much faster and clearer for the AI model to understand.

**Technical Details:**
1. Create `frontend/src/__tests__/components/InterviewEditor.test.tsx`.
2. Mock the `useInterviewStore` and `WebSocketClient`.
3. Simulate typing in the Monaco Editor component.
4. Fast-forward the debounce timer.
5. Assert that a payload structured as `{ role: "user", parts: [{ text: "[SYSTEM: Code Update] ..." }] }` is sent over the socket.

**Architectural Principle:**
- **Event Debouncing:** Prevent flooding the WebSocket and AI Context window by aggregating keystrokes before sending sync messages.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A test asserts that debounced changes in the Monaco Editor trigger a `clientContent` WebSocket payload representing a text-based context update.
<!-- AC:END -->

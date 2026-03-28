---
id: TASK-1.1.1
title: 'Task 1.1.1: [Test] Assert absence of polling loop'
status: To Do
assignee: []
created_date: '2026-03-28 07:08'
updated_date: '2026-03-28 07:20'
labels:
  - tdd-test
  - refactor
dependencies:
  - TASK-5
parent_task_id: TASK-1.1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**TDD Phase: Red (Test First)**

**Context & Goal:** 
The current `WebSocketService` tightly couples the WebSocket transport with an aggressive 5-second polling loop that calls standard REST APIs. This violates the Single Responsibility Principle and creates immense latency. We must write a test to enforce the removal of this loop.

**Technical Details:**
1. Create/open `src/server/__tests__/services/websocket.test.ts`.
2. Mock the `ws` WebSocketServer and instantiate `WebSocketService`.
3. Simulate a candidate connecting to a session.
4. Fast-forward virtual timers using `jest.useFakeTimers()`.
5. Assert that `vertexAI.analyzeTranscript` (or any bound `setInterval` handler) is **not** called. This test will initially fail because the code currently calls `setInterval` to start `runSessionAnalysis`.

**Architectural Principle:**
- **Inversion of Control (IoC):** The transport layer must not dictate business logic timing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A failing unit test exists asserting that `WebSocketService` does not initiate a `setInterval` loop upon session start.
<!-- AC:END -->

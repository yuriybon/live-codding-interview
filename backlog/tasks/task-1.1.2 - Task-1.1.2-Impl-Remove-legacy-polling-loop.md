---
id: TASK-1.1.2
title: 'Task 1.1.2: [Impl] Remove legacy polling loop'
status: To Do
assignee: []
created_date: '2026-03-28 07:08'
updated_date: '2026-03-28 07:20'
labels:
  - tdd-impl
  - refactor
dependencies:
  - TASK-1.1.1
parent_task_id: TASK-1.1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**TDD Phase: Green/Refactor (Implementation)**

**Context & Goal:** 
Strip out the legacy `setInterval` state-checking logic from `src/server/services/websocket.ts` to satisfy the unit test created in TASK-1.1.1.

**Technical Details:**
1. Open `src/server/services/websocket.ts`.
2. Delete the `startSessionAnalysis`, `stopSessionAnalysis`, and `runSessionAnalysis` methods.
3. Remove the `analysisInterval` property from the class.
4. Clean up any lingering dependencies on the legacy `vertex-ai.ts` module that were exclusively used by the interval loop.
5. Run the test suite to ensure the TASK-1.1.1 test now passes.

**Architectural Principle:**
- **Single Responsibility Principle (SRP):** By removing this, `WebSocketService` moves closer to being purely a message relay, preparing it for the streaming bridge architecture.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `setInterval` and `runSessionAnalysis` methods are completely removed from `src/server/services/websocket.ts`, and the test from 1.1.1 passes.
<!-- AC:END -->

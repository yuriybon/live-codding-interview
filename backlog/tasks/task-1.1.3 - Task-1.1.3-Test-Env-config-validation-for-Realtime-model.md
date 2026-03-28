---
id: TASK-1.1.3
title: 'Task 1.1.3: [Test] Env config validation for Realtime model'
status: Done
assignee: []
created_date: '2026-03-28 07:08'
updated_date: '2026-03-28 12:08'
labels:
  - tdd-test
  - setup
dependencies:
  - TASK-1.1.2
parent_task_id: TASK-1.1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**TDD Phase: Red (Test First)**

**Context & Goal:** 
We are switching from `gemini-1.5-flash` via standard REST to the `gemini-2.0-flash-realtime-exp` (or equivalent) Multimodal Live API. The backend must enforce this new configuration on startup.

**Technical Details:**
1. Open `src/server/__tests__/config/env.test.ts` (or create it).
2. Write a test that unsets `GEMINI_REALTIME_MODEL` from `process.env`.
3. Assert that the `env.ts` parser throws a fatal configuration error.
4. Write a second test asserting that providing `GEMINI_REALTIME_MODEL`, `GCP_PROJECT_ID`, and `GCP_LOCATION` successfully parses.

**Architectural Principle:**
- **Fail-Fast Configuration:** Applications should crash on startup if required environment variables are missing, rather than failing opaquely during a user session.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A failing test exists asserting that the environment configuration parser (`env.ts`) throws an error if `GEMINI_REALTIME_MODEL` is missing.
<!-- AC:END -->

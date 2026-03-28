---
id: TASK-1.1.4
title: 'Task 1.1.4: [Impl] Add Realtime environment variables'
status: Done
assignee: []
created_date: '2026-03-28 07:08'
updated_date: '2026-03-28 12:10'
labels:
  - tdd-impl
  - setup
dependencies:
  - TASK-1.1.3
parent_task_id: TASK-1.1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**TDD Phase: Green (Implementation)**

**Context & Goal:** 
Update the environment parsing logic to pass the tests from TASK-1.1.3 and update the developer documentation.

**Technical Details:**
1. Open `src/server/config/env.ts`.
2. Add `GEMINI_REALTIME_MODEL` to the required properties (using Zod, Joi, or custom validation).
3. Update `.env.example` to include `GEMINI_REALTIME_MODEL=gemini-2.0-flash-realtime-exp`.
4. Ensure the test suite passes.

**Architectural Principle:**
- **12-Factor App:** Explicitly declare and isolate configuration from code.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `GEMINI_REALTIME_MODEL` is added to `.env.example` and successfully parsed/validated in `config/env.ts`, causing the test from 1.1.3 to pass.
<!-- AC:END -->

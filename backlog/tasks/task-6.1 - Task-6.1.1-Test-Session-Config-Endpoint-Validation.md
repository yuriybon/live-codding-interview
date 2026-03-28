---
id: TASK-6.1
title: 'Task 6.1.1: [Test] Session Config Endpoint Validation'
status: To Do
assignee: []
created_date: '2026-03-28 07:39'
labels:
  - tdd-test
  - backend
dependencies:
  - TASK-6
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**TDD Phase: Red (Test First)**\nWrite a backend test ensuring the session creation endpoint validates the new configuration payload parameters before initializing a database record or memory store.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A test asserts that a `POST /api/sessions` payload missing `language` or `exerciseId` returns a 400 Bad Request error.
<!-- AC:END -->

---
id: TASK-6.3
title: 'Task 6.1.3: [Test] Dynamic System Prompt Factory'
status: Done
assignee: []
created_date: '2026-03-28 07:41'
updated_date: '2026-03-28 15:47'
labels:
  - tdd-test
  - backend
  - prompts
dependencies:
  - TASK-6.2
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**TDD Phase: Red (Test First)**\nCreate a test for the PromptFactory utility to ensure string interpolation and template selection works properly based on session configuration.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A test exists verifying that `PromptFactory.generate(config)` returns a specialized System Prompt string based on whether the config is "System Design", "Algorithm", or "Refactoring" along with injecting the chosen `{language}`.
<!-- AC:END -->

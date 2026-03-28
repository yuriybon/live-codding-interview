---
id: TASK-13.5
title: 'Task 13.5: [Perf] Measure and compare latency against boxing-coach baseline'
status: To Do
assignee: []
created_date: '2026-03-28 14:19'
labels:
  - performance
  - latency
  - parity
  - test
dependencies:
  - TASK-12.6
  - TASK-13.3
  - TASK-13.4
references:
  - ../boxing-coach/src/lib/audioUtils.test.ts
parent_task_id: TASK-13
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a reproducible local benchmark for bidirectional stream latency and compare current project metrics with boxing-coach baseline behavior for first audio response and interruption responsiveness.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A latency report captures TTFA, chunk gap stability, and interruption cutover metrics for both projects with pass/fail against doc-3 thresholds.
<!-- AC:END -->

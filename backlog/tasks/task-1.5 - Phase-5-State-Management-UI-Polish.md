---
id: TASK-1.5
title: 'Phase 5: State Management & UI Polish'
status: To Do
assignee: []
created_date: '2026-03-28 07:04'
labels:
  - frontend
  - ui-ux
  - zustand
dependencies:
  - TASK-1.4
parent_task_id: TASK-1
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Refactor the frontend state management and user interface to support the new real-time architecture, including interruption handling and visual indicators for audio interaction.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Zustand `interviewStore.ts` refactored to manage the state of active multimodal sessions (connected, AI speaking, user speaking)
- [ ] #2 Interruption logic implemented: frontend sends 'stopOutput' when user interrupts the AI coach
- [ ] #3 UI reflects real-time audio levels or speaking status indicators
<!-- AC:END -->

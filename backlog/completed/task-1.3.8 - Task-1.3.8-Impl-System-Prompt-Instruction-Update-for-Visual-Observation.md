---
id: TASK-1.3.8
title: 'Task 1.3.8: [Impl] System Prompt Instruction Update for Visual Observation'
status: Done
assignee: []
created_date: '2026-03-28 11:53'
updated_date: '2026-03-28 15:02'
labels: []
dependencies:
  - TASK-1.3.6
  - TASK-6.4
parent_task_id: TASK-1.3
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update the AI's System Instruction prompt to make it aware of the new multimodal visual feed. The persona ('Alex') needs specific directives on how to interpret visual coding context, when to interrupt based on what it sees (e.g., brute-force approaches, idle time), and how to behave naturally.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The System Prompt ("Alex" Persona) must be updated to instruct the AI to observe and comment on the screen share feed.
- [x] #2 The AI must recognize predefined screen events (e.g., terminal output, code being typed) and trigger follow-up questions.
- [x] #3 The bot's personality and instructions remain aligned with a "Helpful but Rigorous Senior Architect".
<!-- AC:END -->

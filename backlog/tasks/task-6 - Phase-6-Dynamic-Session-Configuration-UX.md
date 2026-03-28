---
id: TASK-6
title: 'Phase 6: Dynamic Session Configuration & UX'
status: Done
assignee: []
created_date: '2026-03-28 07:39'
updated_date: '2026-03-28 16:26'
labels:
  - feature
  - ux
  - prompts
dependencies:
  - TASK-5
  - TASK-1.2.4
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the UI and Backend routing necessary for users to configure their interview session before joining the room. This includes language selection, exercise type, and a dynamic Prompt Factory.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Users can select a specific language (Java, Python, JS, C++) from a dropdown.
- [x] #2 Users can select an interview type (Algorithms, System Design) from a dropdown.
- [x] #3 Submitting the form creates a session with these configurations tied to the user's ID.
- [x] #4 The backend dynamically builds the Gemini Live System Prompt based on these selections rather than using a static `.env` prompt.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Phase closure based on completed implementation chain TASK-6.1 through TASK-6.6: validated session config endpoint/route, dynamic prompt factory, Gemini session prompt injection, and frontend SessionConfigModal flow. This phase now satisfies configurable language/interview-type selection and dynamic prompt composition requirements.
<!-- SECTION:NOTES:END -->

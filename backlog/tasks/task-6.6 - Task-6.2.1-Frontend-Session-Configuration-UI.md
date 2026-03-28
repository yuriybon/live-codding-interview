---
id: TASK-6.6
title: 'Task 6.2.1: [Frontend] Session Configuration UI'
status: In Progress
assignee: []
created_date: '2026-03-28 07:42'
updated_date: '2026-03-28 15:52'
labels:
  - frontend
  - ui
dependencies:
  - TASK-6.5
parent_task_id: TASK-6
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Frontend Implementation**\nBuild the Dashboard UI that allows users to select their interview preferences. Create the `SessionConfigModal.tsx` component and wire it to the updated backend route.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A React `SessionConfigModal` component is built allowing selection of Language and Interview Type.
- [ ] #2 Submitting the modal calls the `POST /api/sessions` endpoint with the selected data and redirects the user to `/room/:sessionId` on success.
<!-- AC:END -->

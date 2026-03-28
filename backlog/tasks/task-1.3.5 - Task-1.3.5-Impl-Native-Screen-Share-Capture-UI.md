---
id: TASK-1.3.5
title: 'Task 1.3.5: [Impl] Native Screen Share Capture UI'
status: To Do
assignee: []
created_date: '2026-03-28 11:53'
labels: []
dependencies: []
parent_task_id: TASK-1.3
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the frontend user interface and browser APIs to enable screen sharing for the candidate. This involves adding a 'Start Screen Share' button, handling the `navigator.mediaDevices.getDisplayMedia()` permission flow, maintaining the sharing state, and displaying a local preview of the shared stream.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Candidate can start and stop screen sharing from the interview UI.
- [ ] #2 Browser permission flow (navigator.mediaDevices.getDisplayMedia) works successfully on supported desktop browsers.
- [ ] #3 UI clearly shows when sharing is active (e.g., status indicator).
- [ ] #4 Shared content preview is visible in a local <video> element within the interview screen.
<!-- AC:END -->

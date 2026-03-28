---
id: TASK-1.3.6
title: 'Task 1.3.6: [Impl] Video Frame Extraction & WebSocket Transport'
status: To Do
assignee: []
created_date: '2026-03-28 11:53'
labels: []
dependencies:
  - TASK-1.3.5
parent_task_id: TASK-1.3
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the logic to extract individual frames from the active screen sharing stream and transmit them to the backend bridge. This requires drawing the video stream to an offscreen `<canvas>`, exporting base64 JPEG data, and sending it over the WebSocket connection so the Gemini Live API can observe the candidate's screen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Extract frames from the active screen share MediaStream at a fixed interval (e.g., 1 frame per second).
- [ ] #2 Convert the extracted frames into base64-encoded JPEG images.
- [ ] #3 Send the base64-encoded frames over the established WebSocket connection to the backend bridge.
- [ ] #4 The data format must match the `RealtimeInput` requirements for Gemini Live API (mimeType: 'image/jpeg').
<!-- AC:END -->

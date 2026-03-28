---
id: TASK-1.3
title: 'Phase 3: Frontend Multimodal Input (Audio/Video)'
status: To Do
assignee: []
created_date: '2026-03-28 07:04'
labels:
  - frontend
  - multimodal-input
dependencies:
  - TASK-1.2
parent_task_id: TASK-1
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Integrate the Web Audio API and Screen Capture API into the React frontend to capture raw audio and video frames for real-time multimodal analysis by the Gemini Live API. This removes the reliance on text transcripts and simple boolean 'hasChanged' flags.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Frontend captures raw audio bytes from the candidate's microphone as PCM16 (16kHz or 24kHz)
- [ ] #2 Frontend captures the Monaco Editor's content/screen as base64 JPEG frames at 1-2 FPS
- [ ] #3 Multimodal data (audio/video/text) is streamed in RealtimeInput format over the client WebSocket
<!-- AC:END -->

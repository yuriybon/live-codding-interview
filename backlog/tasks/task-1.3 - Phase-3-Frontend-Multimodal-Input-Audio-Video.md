---
id: TASK-1.3
title: 'Phase 3: Frontend Multimodal Input (Audio/Video)'
status: Done
assignee: []
created_date: '2026-03-28 07:04'
updated_date: '2026-03-28 16:43'
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
- [x] #1 Frontend captures raw audio bytes from the candidate's microphone as PCM16 (16kHz or 24kHz)
- [x] #2 Frontend captures the Monaco Editor's content/screen as base64 JPEG frames at 1-2 FPS
- [x] #3 Multimodal data (audio/video/text) is streamed in RealtimeInput format over the client WebSocket
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Picked up as next independent task. This phase is on migration track and has no dependency on TASK-11.7 (UI QA).

Phase closure: PCM16 microphone capture implemented via AudioWorklet in frontend/src/services/AudioRecorderService.ts and wired in frontend/src/pages/InterviewRoom.tsx. Screen-share frame capture implemented via canvas JPEG extraction in frontend/src/services/ScreenShareService.ts and sent at 1 FPS from InterviewRoom.tsx. Multimodal transport uses unified realtime_input with media.mimeType (audio/pcm;rate=16000 and image/jpeg) in frontend/src/services/websocketClient.ts. Validation run: npm --prefix frontend run test:run -- src/__tests__/services/AudioRecorderService.test.ts src/__tests__/services/ScreenShareService.test.ts (27 passed).
<!-- SECTION:NOTES:END -->

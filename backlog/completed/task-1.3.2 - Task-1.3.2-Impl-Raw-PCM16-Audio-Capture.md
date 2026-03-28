---
id: TASK-1.3.2
title: 'Task 1.3.2: [Impl] Raw PCM16 Audio Capture'
status: Done
assignee: []
created_date: '2026-03-28 07:23'
updated_date: '2026-03-28 14:32'
labels:
  - tdd-impl
  - frontend
  - audio
dependencies:
  - TASK-1.3.1
parent_task_id: TASK-1.3
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**TDD Phase: Green (Implementation)**

**Context & Goal:** 
Implement the `AudioWorklet` processing to capture low-latency microphone audio.

**Technical Details:**
1. Create `frontend/public/worklets/pcm-processor.js` (an AudioWorkletProcessor) that captures raw Float32 buffers, converts them to PCM16, and posts them back to the main thread.
2. Implement `frontend/src/services/AudioRecorderService.ts`.
3. Wire the service to emit a callback with base64 encoded audio chunks.
4. Ensure the React UI can start/stop this recording via a microphone button in `InterviewControls.tsx`.

**Architectural Principle:**
- **High-Performance Main Thread:** Offload high-frequency audio sampling to a dedicated Worklet thread to prevent UI jank in React.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `AudioRecorderService` successfully captures raw PCM16 audio, converts it to base64 chunks, and streams it to the `WebSocketClient`, passing the unit test.
<!-- AC:END -->

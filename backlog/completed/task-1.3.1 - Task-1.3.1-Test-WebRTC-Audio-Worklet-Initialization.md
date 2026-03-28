---
id: TASK-1.3.1
title: 'Task 1.3.1: [Test] WebRTC Audio Worklet Initialization'
status: Done
assignee: []
created_date: '2026-03-28 07:22'
updated_date: '2026-03-28 14:27'
labels:
  - tdd-test
  - frontend
  - audio
dependencies:
  - TASK-1.2.4
parent_task_id: TASK-1.3
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**TDD Phase: Red (Test First)**

**Context & Goal:** 
The application needs to capture raw PCM16 audio from the candidate's microphone to stream to the AI. We cannot use `MediaRecorder` because its chunking introduces latency; we must use `AudioWorklet`.

**Technical Details:**
1. Create `frontend/src/__tests__/services/AudioRecorderService.test.ts`.
2. Mock the browser's `navigator.mediaDevices.getUserMedia` and `AudioContext`.
3. Assert that instantiating and starting the service correctly requests a 16kHz or 24kHz audio stream and attaches a custom `pcm-processor.js` worklet.

**Architectural Principle:**
- **Hardware Abstraction Layer (HAL):** Isolate hardware/browser APIs behind a clean service interface.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A frontend test exists asserting that `AudioRecorderService` requests `getUserMedia` and loads the correct `AudioWorklet` processor.
<!-- AC:END -->

---
id: TASK-1.4.1
title: 'Task 1.4.1: [Test] Web Audio API Playback Queue'
status: To Do
assignee: []
created_date: '2026-03-28 07:24'
labels:
  - tdd-test
  - frontend
  - audio
dependencies:
  - TASK-1.3.4
parent_task_id: TASK-1.4
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**TDD Phase: Red (Test First)**

**Context & Goal:** 
When the AI responds with raw PCM16 audio, the frontend must play it smoothly. We need a test for the service that manages the playback buffer queue to ensure audio chunks don't overwrite each other or cause stuttering.

**Technical Details:**
1. Create `frontend/src/__tests__/services/AudioPlaybackService.test.ts`.
2. Mock `AudioContext` and `AudioBufferSourceNode`.
3. Push three simulated PCM16 base64 chunks to the service.
4. Assert that the `start()` times for each chunk are calculated sequentially (chunk2 starts when chunk1 ends).

**Architectural Principle:**
- **Deterministic Scheduling:** Web Audio API requires precise timestamp scheduling to prevent buffer underruns.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A test exists asserting that `AudioPlaybackService` queues incoming PCM16 buffers and successfully schedules them using `AudioContext`.
<!-- AC:END -->

---
id: TASK-1.4.2
title: 'Task 1.4.2: [Impl] AI Voice Playback Queue'
status: To Do
assignee: []
created_date: '2026-03-28 07:25'
labels:
  - tdd-impl
  - frontend
  - audio
dependencies:
  - TASK-1.4.1
parent_task_id: TASK-1.4
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**TDD Phase: Green (Implementation)**

**Context & Goal:** 
Implement the PCM queue playback logic to smoothly stream the AI's voice and support instant interruption when the candidate speaks over the AI.

**Technical Details:**
1. Implement `frontend/src/services/AudioPlaybackService.ts`.
2. Connect it to the `WebSocketClient` to receive `serverContent.modelTurn.parts` containing inline data base64 audio.
3. Decode the base64 -> Uint8Array -> Float32Array and schedule `AudioBufferSourceNode`.
4. Implement a `clearQueue()` function that stops all active source nodes to handle interruptions.

**Architectural Principle:**
- **Reactive Interruption:** The UI must feel instantly responsive when the user interrupts the AI.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Incoming Gemini Live API audio chunks are played back natively in the browser without stuttering or popping.
- [ ] #2 When a user interrupts, the `AudioPlaybackService` successfully clears the buffer queue and halts current playback.
<!-- AC:END -->

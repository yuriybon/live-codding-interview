---
id: TASK-1.5.3
title: 'Task 1.5.3: [Impl] AI Audio Visualizer & Polish'
status: To Do
assignee: []
created_date: '2026-03-28 07:28'
labels:
  - frontend
  - ui
dependencies:
  - TASK-1.5.2
parent_task_id: TASK-1.5
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Context & Goal:** 
The application needs a modern, polished "Agentic UI" like the `boxing-coach` project. We need a visual representation of the AI (e.g., a glowing orb or waveform) so the candidate knows when the AI is listening or speaking.

**Technical Details:**
1. Create `frontend/src/components/AiVisualizer.tsx`.
2. Connect it to the `AudioPlaybackService`'s volume analyzer node or a generic state `isAiSpeaking` flag in the Zustand store.
3. Update `InterviewRoom.tsx` to display this visualizer prominently.
4. Implement standard controls: Mute, End Session.

**Architectural Principle:**
- **Affordance & Feedback:** In real-time voice applications, users need constant, low-latency visual feedback that the system is active to prevent them from repeating themselves out of confusion.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An animated React component (`AiVisualizer.tsx`) exists that reacts to an `audioLevel` prop or global state, visualizing when the AI is speaking.
- [ ] #2 A mute/unmute button exists to stop candidate microphone transmission gracefully.
<!-- AC:END -->

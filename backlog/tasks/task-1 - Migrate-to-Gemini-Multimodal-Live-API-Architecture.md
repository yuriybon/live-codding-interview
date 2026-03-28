---
id: TASK-1
title: Migrate to Gemini Multimodal Live API Architecture
status: To Do
assignee: []
created_date: '2026-03-28 07:03'
labels:
  - feature
  - refactor
  - gemini-live-api
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Transform the existing 'clunky' pseudo-real-time interview simulator into a high-performance, truly multimodal experience using the Gemini 2.0 Flash Realtime (Multimodal Live) API. This involves replacing the current text-based polling architecture with a streaming bidirectional WebSocket bridge that handles raw audio and video frames.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Migration plan document created in Backlog.md documents
- [ ] #2 Backend no longer uses 5-second polling for AI analysis
- [ ] #3 Frontend and Backend communicate via bidirectional binary-capable WebSockets
- [ ] #4 Candidate can speak to the AI and receive voice responses with sub-second latency
- [ ] #5 AI can 'see' the code editor via periodic screen frames
- [ ] #6 Interruption handling is implemented (candidate can speak over the AI)
<!-- AC:END -->

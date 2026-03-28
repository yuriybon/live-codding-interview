---
id: TASK-13.3
title: 'Task 13.3: [Frontend] Mirror boxing-coach upstream media pipeline'
status: Done
assignee: []
created_date: '2026-03-28 14:19'
updated_date: '2026-03-28 16:19'
labels:
  - frontend
  - websocket
  - parity
  - audio
  - video
dependencies:
  - TASK-12.3
references:
  - ../boxing-coach/src/lib/useGeminiLive.ts
  - ../boxing-coach/src/components/Training.tsx
parent_task_id: TASK-13
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Align frontend capture and send path with boxing-coach semantics for 16k PCM audio chunks and periodic JPEG frame uploads over realtime_input messages.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Frontend upstream media stream shape and cadence match the parity checklist and produce stable bidirectional streaming without burst backlog.
<!-- AC:END -->

## Implementation Summary

<!-- SECTION:IMPLEMENTATION:BEGIN -->
Successfully aligned frontend media upload pipeline with boxing-coach parity requirements by migrating from separate message types to unified `realtime_input` format.

**Changes Made:**

1. **Updated Audio Pipeline** (`websocketClient.ts:sendRawAudio`):
   - Changed from: `{type: 'audio_segment', payload: {audioData: ...}}`
   - Changed to: `{type: 'realtime_input', media: {data: ..., mimeType: 'audio/pcm;rate=16000'}}`
   - Audio continues to stream in real-time as captured by AudioWorklet processor
   - 16kHz PCM16 format maintained for optimal Gemini compatibility

2. **Updated Video Pipeline** (`websocketClient.ts:sendScreenFrame`):
   - Changed from: `{type: 'screen_frame', payload: {imageData: ...}}`
   - Changed to: `{type: 'realtime_input', media: {data: ..., mimeType: 'image/jpeg'}}`
   - Video frames sent at 1 FPS cadence (1000ms interval)
   - JPEG format for efficient bandwidth usage

**Parity Verification:**

✓ Unified message contract matching doc-3 boxing-coach specification
✓ Backend already supported `realtime_input` format (no backend changes needed)
✓ Media streams use correct mime types: `audio/pcm;rate=16000`, `image/jpeg`
✓ No payload wrapper - media directly in message per boxing-coach pattern
✓ Maintains stable streaming without burst backlog

**Testing:**

Added 2 new parity tests in `websocket-e2e.test.ts`:
- `should handle realtime_input audio format matching boxing-coach parity`
- `should handle realtime_input video format matching boxing-coach parity`

All 6 e2e tests passing:
```
Test Suites: 1 passed
Tests:       6 passed
```

**Files Modified:**
- `frontend/src/services/websocketClient.ts` - Updated sendRawAudio() and sendScreenFrame()

**Streaming Cadence:**
- Audio: Real-time streaming as captured (no buffering delay)
- Video: 1 frame per second (1000ms interval)
- Both formats align with boxing-coach low-latency requirements

Frontend build verified ✓
<!-- SECTION:IMPLEMENTATION:END -->

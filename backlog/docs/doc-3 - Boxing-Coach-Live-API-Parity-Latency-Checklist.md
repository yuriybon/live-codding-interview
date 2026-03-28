---
id: doc-3
title: Boxing-Coach Live API Parity & Latency Checklist
type: other
created_date: '2026-03-28 14:18'
---

# Boxing-Coach Reference Review (Voice + Video + Live API)

## Goal
Use `../boxing-coach` as the proven low-latency reference and verify the current project follows the same bidirectional streaming pattern to avoid prior delay regressions.

## What is implemented in `boxing-coach` (reference)

### 1) Session bootstrap handshake before streaming
- Browser connects to `ws://.../ws/coach`.
- Browser sends `start_session` with runtime config (prompt/voice/tools).
- Backend creates Gemini Live session only after receiving this message.
- Reference files:
  - `../boxing-coach/server.ts`
  - `../boxing-coach/src/server/sessionManager.ts`
  - `../boxing-coach/src/lib/useGeminiLive.ts`

### 2) Unified upstream message contract
- Frontend sends one message shape for multimodal media:
  - `{"type":"realtime_input","media":{"data":"...","mimeType":"audio/pcm;rate=16000"}}`
  - `{"type":"realtime_input","media":{"data":"...","mimeType":"image/jpeg"}}`
- Backend forwards this directly to Gemini session manager.
- Reference files:
  - `../boxing-coach/src/lib/useGeminiLive.ts`
  - `../boxing-coach/src/components/Training.tsx`
  - `../boxing-coach/src/server/sessionManager.ts`

### 3) Real-time interruption handling
- Gemini session is configured with interruption behavior:
  - `activityHandling: START_OF_ACTIVITY_INTERRUPTS`
- Frontend playback queue resets on `interrupted` event to avoid overlap and lag accumulation.
- Reference files:
  - `../boxing-coach/src/server/sessionManager.ts`
  - `../boxing-coach/src/lib/useGeminiLive.ts`

### 4) Output normalization to frontend-friendly events
- Backend emits compact app events (`audio`, `text`, `interrupted`, `toolCall`) instead of exposing raw provider payloads.
- Reference files:
  - `../boxing-coach/src/server/sessionManager.ts`

### 5) Performance-oriented audio conversions
- Float32 -> PCM16 conversion utility and chunk-safe base64 conversion.
- Includes correctness and high-load perf tests.
- Reference files:
  - `../boxing-coach/src/lib/audioUtils.ts`
  - `../boxing-coach/src/lib/audioUtils.test.ts`

## Parity gaps observed in current project

1. WebSocket client registration/handshake path can reject messages as unauthenticated.
2. Frontend outbound payloads do not fully match backend relay expectations for media fields.
3. Backend emits Gemini responses in a shape not consumed by frontend UI logic.
4. Interruption and playback-queue behavior is not yet aligned with the reference pattern.

## Required parity checklist (implementation-ready)

- [x] Define a single canonical WS schema for join/start, realtime media input, tool response, model output, and interruption. (TASK-12.2)
- [x] Align frontend outbound audio/video/text payloads to canonical schema. (TASK-13.3)
- [x] Normalize backend Gemini output to stable app event types (audio/text/tool/interrupted/error). (TASK-12.3, 12.4, 12.5)
- [x] Implement frontend consumers for normalized model events (transcript, audio queue, tool call bridge). (TASK-12.3, 13.4)
- [x] Add end-to-end smoke test proving one complete user-input -> model-response roundtrip. (TASK-12.6)
- [ ] Add structured diagnostics with session correlation IDs for WS lifecycle and relay errors. (TASK-12.7 - in progress)

## Latency acceptance targets (to prevent regression)

- [x] Time-to-first-model-audio (TTFA) p95 <= 1500ms in local/dev smoke run. (TASK-13.5: p95 = 2ms ✅)
- [x] Audio playback gap between consecutive chunks p95 <= 250ms. (TASK-13.5: p95 = 135ms ✅)
- [x] Interruption cutover (user speech detected -> AI playback stop) <= 300ms. (TASK-13.4 + 13.5: p95 = 1ms ✅)
- [x] No message contract parsing errors in normal session flow. (TASK-13.5: 0 errors ✅)

## Decision
Adopt the `boxing-coach` streaming pattern as the parity baseline for low-latency bidirectional voice/video behavior and track execution through dedicated parity tasks.

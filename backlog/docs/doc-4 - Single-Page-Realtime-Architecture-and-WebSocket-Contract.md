---
id: doc-4
title: Single-Page Realtime Architecture and WebSocket Contract
type: architecture
created_date: '2026-03-28 15:05'
---

# Realtime Single-Page Architecture (Target)

## Goal
Define one canonical end-to-end architecture and message contract so frontend, backend, and Gemini Live communicate reliably with low latency.

## Scope
- Authenticated interview session over one browser WebSocket connection.
- Bidirectional multimodal streaming (audio, video, text).
- Normalized backend events for stable frontend rendering/playback behavior.

## System Components
- **Frontend UI:** `InterviewRoom` page and state store.
- **Frontend transport:** `frontend/src/services/websocketClient.ts`.
- **Backend bridge:** `src/server/services/websocket.ts`.
- **Model session layer:** Gemini Live session manager/relay.
- **Reference baseline:** `../boxing-coach` architecture and behavior.

## End-to-End Flow
1. Frontend creates/receives `sessionId` via HTTP session API.
2. Frontend opens WebSocket and sends `join_session`.
3. Backend authenticates + registers socket for `sessionId`, then emits `session_joined`.
4. Frontend sends `start_session` (prompt/voice/tools/runtime config).
5. Backend initializes Gemini Live session and emits `session_started`.
6. Frontend streams media as `realtime_input` chunks (audio/video).
7. Backend forwards chunks upstream to Gemini Live.
8. Backend normalizes Gemini responses to stable app events (`model_audio`, `model_text`, `model_interrupted`, `tool_call`, `error`).
9. Frontend updates transcript, playback queue, and tool bridge from normalized events.
10. On user interruption, frontend clears queued AI playback immediately.

## Canonical Message Envelope (v1)
All WS messages use:

```json
{
  "v": 1,
  "type": "event_name",
  "sessionId": "string",
  "requestId": "optional-string",
  "timestampMs": 0
}
```

## Client -> Server Events
- `join_session`
  - Fields: `sessionId`
- `start_session`
  - Fields: `config.systemPrompt`, `config.voice`, `config.tools[]`
- `realtime_input`
  - Fields: `media.kind` (`audio` | `video`), `media.mimeType`, `media.data` (base64), `media.sequence`
- `client_text`
  - Fields: `text`
- `tool_result`
  - Fields: `toolCallId`, `result`
- `ping`
  - Fields: none

## Server -> Client Events
- `session_joined`
  - Fields: `sessionId`, `connectionId`
- `session_started`
  - Fields: `sessionId`, `model`, `voice`
- `model_audio`
  - Fields: `audio.mimeType`, `audio.data` (base64), `audio.sequence`
- `model_text`
  - Fields: `text`, `isFinal`
- `model_interrupted`
  - Fields: `reason`
- `tool_call`
  - Fields: `toolCallId`, `name`, `arguments`
- `error`
  - Fields: `code`, `message`, `retryable`
- `pong`
  - Fields: none

## Contract Rules
- Reject messages with missing `v`, `type`, or `sessionId` (except pre-join auth failures).
- Use strict event names above; no provider-specific raw payloads on frontend channel.
- Audio/video payloads are base64 encoded binary chunks only.
- Outbound model events are normalized once in backend before broadcasting to frontend.

## Latency and Behavior Targets
- TTFA p95 <= 1500ms.
- Audio chunk playback gap p95 <= 250ms.
- Interruption cutover <= 300ms.
- Zero contract parsing errors in standard happy path.

## Task Linkage
- **Contract definition:** `TASK-12.2`.
- **Implementation consumers:** `TASK-12.3`, `TASK-12.4`, `TASK-12.5`.
- **Parity validation:** `TASK-13.1` through `TASK-13.6`.

## Out of Scope
- UI visual redesign details (tracked in `TASK-11.*`).
- Vendor-specific raw schema exposure to frontend.

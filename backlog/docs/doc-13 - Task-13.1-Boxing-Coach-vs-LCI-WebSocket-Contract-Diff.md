---
id: doc-13
title: Task 13.1 Boxing-Coach vs LCI WebSocket Contract Diff
type: technical
created_date: '2026-03-28 15:33'
---

# TASK-13.1 Contract Diff Artifact

## Scope
Field-by-field diff between `../boxing-coach` websocket payloads and the current `live-codding-interview` payloads for:
- start session
- realtime media input
- model output
- interruption
- tool calls

## Evidence Sources
- `../boxing-coach/src/lib/useGeminiLive.ts`
- `../boxing-coach/src/server/sessionManager.ts`
- `../boxing-coach/server.ts`
- `frontend/src/services/websocketClient.ts`
- `src/server/services/websocket.ts`
- `src/server/services/gemini-live.ts`

## Diff Matrix (Field-by-Field)

| Flow | Field | Boxing-Coach (reference) | Current LCI | Mismatch | Owning Task |
|---|---|---|---|---|---|
| Start session | Client event name | `type: "start_session"` on WS open | No `start_session`; sends `type: "join_session"` | Session init contract differs | `TASK-13.2` (backend lifecycle), `TASK-13.3` (frontend send shape) |
| Start session | Config envelope | `config.systemInstruction`, `config.voiceName`, `config.tools` | No runtime config sent from frontend | Runtime prompt/voice/tools not client-driven | `TASK-13.2`, `TASK-13.3` |
| Start session | Backend gating behavior | Gemini session created only after `start_session` | Gemini client connects in service setup path, not explicit per-session start | No explicit start gate parity | `TASK-13.2` |
| Realtime media input | Unified upstream event | Single `type: "realtime_input"` for audio+video | Uses `audio_segment` and `screen_frame` | Event taxonomy diverges | `TASK-13.3` |
| Realtime media input | Media field names | `media.data` + `media.mimeType` | `payload.audioData` / `payload.imageData` | Field names and envelope diverge | `TASK-13.3`, `TASK-13.2` |
| Realtime media input | Audio mime detail | `audio/pcm;rate=16000` from client | No mime sent from frontend WS layer | Missing explicit upstream mime metadata | `TASK-13.3` |
| Realtime media input | Video frame shape | `realtime_input.media` with `mimeType: image/jpeg` | `screen_frame.payload.imageData` + `hasCodeChanges` | Extra/non-parity fields + different container | `TASK-13.3` |
| Model output | Event naming | `audio`, `text`, `interrupted`, `toolCall` | `model_audio`, `model_text`, `model_interruption`, `model_tool_call` | Naming differs from reference | `TASK-13.2` (translation/compat strategy) |
| Model output | Payload nesting | Top-level `data`, `text`, `toolCall` | Nested `payload.*` with metadata/isFinal | Envelope shape differs | `TASK-13.2` |
| Model output | Session routing model | Per-WS `SessionManager` instance | Shared `activeGeminiSessionId` mutable pointer | Multi-session routing semantics differ | `TASK-13.2` |
| Interruption | Gemini runtime config | `realtimeInputConfig.activityHandling = START_OF_ACTIVITY_INTERRUPTS` | No `realtimeInputConfig.activityHandling` in setup | Interruption trigger config differs | `TASK-13.2` |
| Interruption | Client playback reset behavior | Sets `nextPlayTime` to current audio context time on `interrupted` | Calls `audioPlaybackQueue.stop()` on `model_interruption` | Reset semantics are different implementation style; parity needs timing validation | `TASK-13.4` |
| Tool calls | Server -> client tool call | `type: "toolCall"` + `toolCall` object | `type: "model_tool_call"` + `payload { tool, args, toolCallId }` | Event/payload shape differs | `TASK-13.2` |
| Tool calls | Client -> server tool response | `type: "tool_response"` + `toolResponses[]` | `type: "tool_response"` + `payload { toolCallId, output }` | Response payload shape differs | `TASK-13.3`, `TASK-13.2` |
| Tool calls | Backend handling of tool response | Explicit `tool_response` handler forwards to Gemini `sendToolResponse` | No `tool_response` case in backend switch | Tool response relay gap | `TASK-13.2` |
| Tool calls | Gemini client API support | Session manager exposes `sendToolResponse` | `GeminiLiveClient` has no `sendToolResponse` method | Missing downstream relay primitive | `TASK-13.2` |

## Mismatch-to-Task Ownership Register

| Mismatch ID | Description | Owning Task |
|---|---|---|
| MM-01 | Missing `start_session` runtime init contract (frontend+backend) | `TASK-13.2`, `TASK-13.3` |
| MM-02 | Missing explicit start-session gating before Gemini session lifecycle | `TASK-13.2` |
| MM-03 | Realtime media envelope/event mismatch (`realtime_input` vs split events) | `TASK-13.3` |
| MM-04 | Backend WS route switch not aligned to boxing-coach media/tool event handling | `TASK-13.2` |
| MM-05 | Model output event naming/envelope mismatch requires parity strategy | `TASK-13.2` |
| MM-06 | Shared active-session pointer differs from per-connection routing model | `TASK-13.2` |
| MM-07 | Interruption activity config parity gap | `TASK-13.2` |
| MM-08 | Interruption playback reset parity/timing behavior needs alignment + validation | `TASK-13.4` |
| MM-09 | Tool-call response roundtrip gap (frontend payload + backend forwarding + Gemini client API) | `TASK-13.2`, `TASK-13.3` |

## Notes
- This artifact intentionally maps every detected mismatch to at least one owning implementation task.
- Performance confirmation for interruption/audio timing remains owned by `TASK-13.5` after implementation work in `TASK-13.3` and `TASK-13.4`.

## Key Evidence (Line Anchors)
- Boxing start session + realtime input + tool response: `../boxing-coach/src/lib/useGeminiLive.ts:85-92`, `:101-104`, `:196-199`, `:205-208`
- Boxing interruption config + output/tool relay: `../boxing-coach/src/server/sessionManager.ts:34-36`, `:54-59`, `:76-77`, `:86-87`, `:90-91`
- Boxing WS route handling: `../boxing-coach/server.ts:296-304`
- Current frontend events: `frontend/src/services/websocketClient.ts:24-28`, `:169-176`, `:218-220`, `:262-266`, `:282-283`, `:83-104`
- Current backend WS switch + routing model: `src/server/services/websocket.ts:173-200`, `:309-317`, `:334-342`, `:385-389`, `:444-451`
- Current model normalization: `src/server/services/websocket.ts:454-526`
- Current Gemini setup and input API surface: `src/server/services/gemini-live.ts:182-240`, `:286-297`, `:304-315`, `:322-337`

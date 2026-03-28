# WebSocket Message Contract v1.0

## Overview

This document describes the canonical WebSocket message contract for the AI Interview Simulator. All messages between frontend and backend MUST conform to this schema.

**Contract Version:** 1.0.0
**Last Updated:** 2026-03-28
**Type Definitions:** `src/shared/websocket-contract.ts`

## Message Flow

```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│   Frontend  │                    │   Backend   │                    │   Gemini    │
│   Client    │                    │  WebSocket  │                    │  Live API   │
└──────┬──────┘                    └──────┬──────┘                    └──────┬──────┘
       │                                  │                                  │
       │  1. join_session                 │                                  │
       │─────────────────────────────────>│                                  │
       │                                  │                                  │
       │  2. session_joined               │                                  │
       │<─────────────────────────────────│                                  │
       │                                  │                                  │
       │  3. audio_segment                │                                  │
       │─────────────────────────────────>│  sendAudio(pcm16)                │
       │                                  │─────────────────────────────────>│
       │                                  │                                  │
       │  4. screen_frame                 │                                  │
       │─────────────────────────────────>│  sendVideoFrame(jpeg)            │
       │                                  │─────────────────────────────────>│
       │                                  │                                  │
       │                                  │  GeminiLiveMessage               │
       │                                  │<─────────────────────────────────│
       │                                  │                                  │
       │                                  │  (normalize response)            │
       │                                  │                                  │
       │  5. model_text                   │                                  │
       │<─────────────────────────────────│                                  │
       │                                  │                                  │
       │  6. model_audio                  │                                  │
       │<─────────────────────────────────│                                  │
       │                                  │                                  │
```

## Base Message Structure

All messages share this base structure:

```typescript
{
  type: string;           // Message type identifier
  payload: object;        // Type-specific payload
  sessionId: string;      // Session UUID
  timestamp: number;      // Unix timestamp (ms)
}
```

## Client → Server Messages

### 1. `join_session`

Client joins an interview session.

**When:** Immediately after WebSocket connection
**Frequency:** Once per connection

```typescript
{
  type: 'join_session',
  payload: {
    sessionId: string;      // Session ID from URL
    isCandidate: boolean;   // true for candidate, false for observer
  },
  sessionId: string,
  timestamp: number
}
```

### 2. `audio_segment`

Client sends microphone audio.

**When:** User speaks (Web Speech API or AudioWorklet)
**Frequency:** Continuous during speech

```typescript
{
  type: 'audio_segment',
  payload: {
    audioData: string;      // Base64-encoded PCM16 (16kHz, mono, 16-bit)
    transcript?: string;    // Optional transcript from Web Speech API
    duration?: number;      // Duration in milliseconds
  },
  sessionId: string,
  timestamp: number
}
```

**Audio Format:**
- Sample Rate: 16kHz
- Channels: Mono (1)
- Bit Depth: 16-bit linear PCM
- Encoding: Base64 (without data URI prefix)

### 3. `screen_frame`

Client sends screen capture frame.

**When:** Periodic (1 FPS via ScreenShareService)
**Frequency:** Every 1000ms while screen sharing

```typescript
{
  type: 'screen_frame',
  payload: {
    imageData: string;      // Base64-encoded JPEG (no data URI prefix)
    hasCodeChanges: boolean; // true if code changed since last frame
  },
  sessionId: string,
  timestamp: number
}
```

**Image Format:**
- Format: JPEG
- Quality: 0.8
- Resolution: Up to 1920x1080
- Encoding: Base64 (without `data:image/jpeg;base64,` prefix)

### 4. `code_update`

Client sends code editor content.

**When:** User modifies code in Monaco Editor
**Frequency:** Debounced (500ms after last change)

```typescript
{
  type: 'code_update',
  payload: {
    code: string;           // Full source code content
    language: string;       // 'javascript', 'python', 'typescript', etc.
  },
  sessionId: string,
  timestamp: number
}
```

### 5. `request_feedback`

Client explicitly requests help/hint.

**When:** User clicks "Request Hint" button
**Frequency:** User-triggered

```typescript
{
  type: 'request_feedback',
  payload: {
    reason: string;         // Why user needs help
  },
  sessionId: string,
  timestamp: number
}
```

### 6. `acknowledge_feedback`

Client acknowledges received feedback.

**When:** User dismisses feedback panel
**Frequency:** Per feedback item

```typescript
{
  type: 'acknowledge_feedback',
  payload: {
    feedbackId: string;     // ID of acknowledged feedback
  },
  sessionId: string,
  timestamp: number
}
```

## Server → Client Messages

### 1. `connected`

Server confirms WebSocket connection.

**When:** Immediately after connection established
**Frequency:** Once per connection

```typescript
{
  type: 'connected',
  payload: {
    clientId: string;       // Temporary client ID
    message: string;        // Welcome message
  },
  sessionId: string,        // Same as clientId initially
  timestamp: number
}
```

### 2. `session_joined`

Server confirms session join.

**When:** After processing `join_session` message
**Frequency:** Once per session

```typescript
{
  type: 'session_joined',
  payload: {
    sessionId: string;
    isCandidate: boolean;
    currentQuestion?: {
      id: string;
      title: string;
      difficulty: 'easy' | 'medium' | 'hard';
      description: string;
    }
  },
  sessionId: string,
  timestamp: number
}
```

### 3. `session_update`

Server sends session status change.

**When:** Session status changes (idle → active → completed)
**Frequency:** Per status change

```typescript
{
  type: 'session_update',
  payload: {
    sessionId: string;
    status: 'idle' | 'active' | 'paused' | 'completed';
  },
  sessionId: string,
  timestamp: number
}
```

### 4. `model_text` ⭐ Critical

Server sends AI interviewer text response.

**When:** Gemini Live API returns text content
**Frequency:** Continuous during AI responses

```typescript
{
  type: 'model_text',
  payload: {
    text: string;           // Text content from AI
    isFinal: boolean;       // true if complete, false if streaming
    metadata?: {
      responseType?: 'hint' | 'question' | 'observation' | 'encouragement';
      confidence?: number;  // 0-1 confidence score
    }
  },
  sessionId: string,
  timestamp: number
}
```

**Frontend Action:** Display in feedback panel, append to conversation

### 5. `model_audio` ⭐ Critical

Server sends AI interviewer voice response.

**When:** Gemini Live API returns audio content
**Frequency:** Continuous during AI responses

```typescript
{
  type: 'model_audio',
  payload: {
    audioData: string;      // Base64-encoded PCM16 (24kHz, mono, 16-bit)
    duration?: number;      // Duration in milliseconds
    isFinal: boolean;       // true if last chunk
  },
  sessionId: string,
  timestamp: number
}
```

**Audio Format:**
- Sample Rate: 24kHz (Gemini output)
- Channels: Mono (1)
- Bit Depth: 16-bit linear PCM
- Encoding: Base64

**Frontend Action:** Queue for Web Audio API playback

### 6. `model_interruption`

Server signals AI was interrupted.

**When:** User speaks while AI is responding
**Frequency:** Per interruption event

```typescript
{
  type: 'model_interruption',
  payload: {
    reason: 'user_speech' | 'user_input' | 'timeout';
  },
  sessionId: string,
  timestamp: number
}
```

**Frontend Action:** Stop audio playback, clear queue

### 7. `model_tool_call`

Server sends AI tool call instruction.

**When:** Gemini requests to execute a tool (e.g., update editor)
**Frequency:** Per tool call

```typescript
{
  type: 'model_tool_call',
  payload: {
    tool: string;           // Tool name (e.g., 'update_code')
    args: object;           // Tool-specific arguments
    toolCallId: string;     // For tracking
  },
  sessionId: string,
  timestamp: number
}
```

**Frontend Action:** Execute tool, send result back

### 8. `feedback`

Server sends structured feedback.

**When:** AI generates feedback or user requests hint
**Frequency:** Variable

```typescript
{
  type: 'feedback',
  payload: {
    id: string;
    type: 'hint' | 'coach' | 'interviewer' | 'correction';
    content: string;
    trigger: 'request' | 'proactive' | 'stuck' | 'error';
    acknowledged: boolean;
  },
  sessionId: string,
  timestamp: number
}
```

### 9. `error`

Server sends error message.

**When:** Validation fails, internal error, etc.
**Frequency:** Per error

```typescript
{
  type: 'error',
  payload: {
    message: string;
    code?: string;
    details?: object;
  },
  sessionId: string,
  timestamp: number
}
```

## Gemini Live API Response Normalization

The backend receives raw Gemini Live API messages and transforms them into normalized `model_*` messages.

### Raw Gemini Format

```typescript
{
  serverContent: {
    modelTurn: {
      parts: [
        { text: "I see you're working on..." },
        { inlineData: { mimeType: "audio/pcm", data: "base64..." } },
        { functionCall: { name: "update_code", args: {...} } }
      ]
    },
    turnComplete: true,
    interrupted: false
  }
}
```

### Normalized Output

```typescript
// Part 1: Text
{
  type: 'model_text',
  payload: {
    text: "I see you're working on...",
    isFinal: false
  }
}

// Part 2: Audio
{
  type: 'model_audio',
  payload: {
    audioData: "base64...",
    isFinal: false
  }
}

// Part 3: Tool Call
{
  type: 'model_tool_call',
  payload: {
    tool: 'update_code',
    args: {...},
    toolCallId: 'uuid-here'
  }
}
```

## Validation

All messages MUST:
1. Have all required fields (`type`, `payload`, `sessionId`, `timestamp`)
2. Use valid message types (see type unions)
3. Have properly formatted payloads
4. Use valid base64 for binary data (audio/image)
5. Include Unix timestamps in milliseconds

Use validation helpers from `src/shared/websocket-contract.ts`:
- `validateBaseMessage(data)`
- `validateAudioData(audioData)`
- `validateImageData(imageData)`

## Error Handling

### Client Errors

- **Invalid format:** Server responds with `error` message
- **Not joined:** Server requires `join_session` first
- **Session not found:** Server responds with `error`

### Server Errors

- **Gemini unavailable:** Backend continues without AI responses
- **Parsing failed:** Backend logs error, doesn't crash

## Versioning

Contract changes MUST update version number:
- **Major:** Breaking changes (incompatible)
- **Minor:** New message types (backward compatible)
- **Patch:** Bug fixes, clarifications

Current: `1.0.0`

## Testing

Contract compliance SHOULD be tested:
1. Unit tests for validation helpers
2. Integration tests for message flow
3. E2E smoke tests for complete cycle

See: `src/server/__tests__/services/websocket.test.ts`

## Migration Guide

### From Legacy Format

Old messages used inconsistent payloads. Migrate by:

1. Add `sessionId` and `timestamp` to all messages
2. Wrap data in `payload` object
3. Use typed interfaces from contract
4. Validate with helper functions

### Example

```typescript
// OLD (inconsistent)
ws.send(JSON.stringify({ text: "hello" }))

// NEW (contract-compliant)
import { ModelTextMessage } from '@/shared/websocket-contract';

const message: ModelTextMessage = {
  type: 'model_text',
  payload: {
    text: "hello",
    isFinal: true
  },
  sessionId: session.id,
  timestamp: Date.now()
};
ws.send(JSON.stringify(message));
```

## References

- Type Definitions: `src/shared/websocket-contract.ts`
- Backend Implementation: `src/server/services/websocket.ts`
- Frontend Implementation: `frontend/src/services/websocketClient.ts`
- Tests: `src/server/__tests__/services/websocket.test.ts`

---
id: doc-1
title: Gemini Multimodal Live API Migration Plan
type: other
created_date: '2026-03-28 07:03'
---
# Migration Plan: Gemini Multimodal Live API

## Motivation
The current `live-codding-interview` implementation uses a "pseudo-real-time" architecture based on a 5-second polling loop and text-only communication. This results in high latency, poor UX, and a lack of true multimodal features (voice/vision). We aim to reach parity with the `boxing-coach` project by migrating to the Gemini Multimodal Live API.

## Core Architectural Changes
1. **Remove Polling:** Eliminate `setInterval` loops in the backend.
2. **Streaming Bridge:** Create a Node.js relay that bridges the client WebSocket with the Vertex AI / Gemini Live WebSocket.
3. **Binary Data Flow:**
   - **Upstream:** Raw PCM16 audio (candidate voice) + Base64 image frames (editor screen).
   - **Downstream:** Raw PCM16 audio (AI voice).
4. **Interruption Logic:** Handle `turnComplete` and `stopOutput` signals to allow natural conversation.

## Phases

### Phase 1: Architecture Teardown & Setup
- Cleanup `src/server/services/websocket.ts`.
- Update `.env` for `gemini-2.0-flash-realtime-exp`.
- Add Vertex AI / Gemini Live SDK or manual WebSocket connection logic.

### Phase 2: Real-time Backend Bridge
- Establish secure WebSocket connection to Gemini Live.
- Pipe binary/JSON messages between client and AI.

### Phase 3: Frontend - Multimodal Input
- Web Audio API (Microphone) integration.
- Screen Capture (Canvas/Monaco) at 1-2 FPS.

### Phase 4: Frontend - Multimodal Output
- Web Audio API (PCM playback queue).
- Latency-optimized audio buffer management.

### Phase 5: State & UI
- Zustand store refactor for "Active Session" states.
- Interruption UI indicators.

/**
 * WebSocket End-to-End Smoke Test
 * TASK-12.6: Verify complete request/response loop through WebSocket bridge
 *
 * This test validates that:
 * 1. A client can connect to the WebSocket server
 * 2. A client can send one valid input payload (realtime_input)
 * 3. The client receives a model-originated response event
 *
 * This proves the full integration across:
 * - Frontend message format
 * - Backend relay
 * - Gemini Live API (mocked)
 * - Backend normalization
 * - Frontend response handling
 */

import WebSocket from 'ws';
import { WebSocketService } from '../../services/websocket';
import { GeminiLiveClient } from '../../services/gemini-live';

// Mock the env config
jest.mock('../../config/env', () => ({
  env: {
    WS_PORT: '8081',
    NODE_ENV: 'test',
  },
}));

// Mock GeminiLiveClient
jest.mock('../../services/gemini-live', () => {
  const EventEmitter = require('events');

  class MockGeminiLiveClient extends EventEmitter {
    connected: boolean = false;

    async connect() {
      this.connected = true;
      this.emit('connected');
    }

    disconnect() {
      this.connected = false;
      this.emit('disconnected');
    }

    isConnected() {
      return this.connected;
    }

    send = jest.fn();
    sendAudio = jest.fn();
    sendVideoFrame = jest.fn();
    sendText = jest.fn();
    sendToolResponse = jest.fn();
  }

  return {
    GeminiLiveClient: MockGeminiLiveClient,
  };
});

describe('WebSocket End-to-End Smoke Test (TASK-12.6)', () => {
  let wsService: WebSocketService;
  let client: WebSocket;
  let mockGeminiClient: any;
  const TEST_PORT = 8091; // Use unique port to avoid conflicts
  const sessionId = 'e2e-smoke-test-session';

  beforeEach(async () => {
    // Start the WebSocket server
    wsService = new WebSocketService(TEST_PORT);

    // Inject mock Gemini client
    mockGeminiClient = new (require('../../services/gemini-live').GeminiLiveClient)();
    await mockGeminiClient.connect();
    (wsService as any).geminiClient = mockGeminiClient;
  });

  afterEach(async () => {
    // Clean up
    if (client && client.readyState === WebSocket.OPEN) {
      client.close();
    }
    if (wsService) {
      wsService.close();
    }

    // Wait a bit for cleanup
    await new Promise(resolve => setTimeout(resolve, 200));
  });

  /**
   * End-to-End Smoke Test: Complete Request/Response Loop
   *
   * This test validates the full happy path:
   * 1. Client connects to WebSocket server
   * 2. Client sends join_session
   * 3. Server responds with session_joined
   * 4. Client sends start_session
   * 5. Server responds with session_started
   * 6. Client sends realtime_input (audio)
   * 7. Server relays to Gemini
   * 8. Gemini sends response (simulated)
   * 9. Server normalizes and broadcasts model response
   * 10. Client receives normalized model event
   */
  it('should complete one full request/response loop from client to Gemini and back', async () => {
    // Step 1: Connect client to WebSocket server
    client = new WebSocket(`ws://localhost:${TEST_PORT}`);

    const receivedMessages: any[] = [];

    // Wait for client connection to open
    await new Promise<void>((resolve) => {
      client.on('open', () => {
        resolve();
      });
    });

    // Collect all messages received from server
    client.on('message', (data) => {
      const message = JSON.parse(data.toString());
      receivedMessages.push(message);
    });

    // Step 2: Send join_session
    const joinMessage = {
      type: 'join_session',
      payload: {
        sessionId,
        isCandidate: true,
      },
      sessionId,
      timestamp: Date.now(),
    };

    client.send(JSON.stringify(joinMessage));

    // Wait for session_joined response
    await waitForMessage(receivedMessages, 'session_joined', 2000);

    const sessionJoinedMsg = receivedMessages.find(m => m.type === 'session_joined');
    expect(sessionJoinedMsg).toBeDefined();
    expect(sessionJoinedMsg.payload.sessionId).toBe(sessionId);

    // Step 3: Send start_session
    const startMessage = {
      type: 'start_session',
      payload: {
        config: {
          systemInstruction: 'You are a helpful AI interviewer.',
          voiceName: 'Zephyr',
        },
      },
      sessionId,
      timestamp: Date.now(),
    };

    client.send(JSON.stringify(startMessage));

    // Wait for session_started response
    await waitForMessage(receivedMessages, 'session_started', 2000);

    const sessionStartedMsg = receivedMessages.find(m => m.type === 'session_started');
    expect(sessionStartedMsg).toBeDefined();
    expect(sessionStartedMsg.payload.sessionId).toBe(sessionId);

    // Step 4: Send realtime_input (audio)
    // Clear any previous mock calls
    mockGeminiClient.sendAudio.mockClear();

    const audioInputMessage = {
      type: 'realtime_input',
      media: {
        data: 'YXVkaW8tZGF0YS1iYXNlNjQ=', // base64: "audio-data-base64"
        mimeType: 'audio/pcm;rate=16000',
      },
      sessionId,
      timestamp: Date.now(),
    };

    client.send(JSON.stringify(audioInputMessage));

    // Verify audio was sent to Gemini
    await new Promise(resolve => setTimeout(resolve, 200));

    // Debug: Check if geminiClient is connected
    const isConnected = mockGeminiClient.isConnected();
    expect(isConnected).toBe(true);

    expect(mockGeminiClient.sendAudio).toHaveBeenCalledWith('YXVkaW8tZGF0YS1iYXNlNjQ=');

    // Step 5: Simulate Gemini response
    // The Gemini client will emit a message event that the WebSocket service will handle
    const mockGeminiResponse = {
      serverContent: {
        modelTurn: {
          parts: [
            { text: 'That sounds like a great approach for solving this problem.' },
            {
              inlineData: {
                mimeType: 'audio/pcm;rate=24000',
                data: 'bW9jay1hdWRpby1yZXNwb25zZQ==', // base64: "mock-audio-response"
              },
            },
          ],
        },
        turnComplete: true,
      },
    };

    mockGeminiClient.emit('message', mockGeminiResponse);

    // Step 6: Wait for normalized model response events
    await waitForMessage(receivedMessages, 'model_text', 2000);
    await waitForMessage(receivedMessages, 'model_audio', 2000);

    // Verify normalized responses were received
    const modelTextMsg = receivedMessages.find(m => m.type === 'model_text');
    expect(modelTextMsg).toBeDefined();
    expect(modelTextMsg.payload.text).toBe('That sounds like a great approach for solving this problem.');
    expect(modelTextMsg.payload.isFinal).toBe(true);

    const modelAudioMsg = receivedMessages.find(m => m.type === 'model_audio');
    expect(modelAudioMsg).toBeDefined();
    expect(modelAudioMsg.payload.audioData).toBe('bW9jay1hdWRpby1yZXNwb25zZQ==');

    // Verify feedback was created
    const feedbackMsg = receivedMessages.find(m => m.type === 'feedback');
    expect(feedbackMsg).toBeDefined();
    expect(feedbackMsg.payload.type).toBe('interviewer');

    // SUCCESS: Complete request/response loop verified!
    // ✓ Client connected
    // ✓ Session joined
    // ✓ Session started
    // ✓ Audio input sent
    // ✓ Relayed to Gemini
    // ✓ Gemini response received
    // ✓ Response normalized
    // ✓ Client received model events
  }, 10000);

  /**
   * Additional smoke test: Video frame input
   */
  it('should handle video frame input and trigger Gemini relay', async () => {
    // Connect fresh client
    const videoClient = new WebSocket(`ws://localhost:${TEST_PORT}`);
    const receivedMessages: any[] = [];

    try {
      await new Promise<void>((resolve) => {
        videoClient.on('open', () => {
          resolve();
        });
      });

      videoClient.on('message', (data) => {
        receivedMessages.push(JSON.parse(data.toString()));
      });

      // Join session
      videoClient.send(JSON.stringify({
        type: 'join_session',
        payload: { sessionId: 'video-test-session', isCandidate: true },
        sessionId: 'video-test-session',
        timestamp: Date.now(),
      }));

      await waitForMessage(receivedMessages, 'session_joined', 2000);

      // Start session
      videoClient.send(JSON.stringify({
        type: 'start_session',
        payload: { config: {} },
        sessionId: 'video-test-session',
        timestamp: Date.now(),
      }));

      await waitForMessage(receivedMessages, 'session_started', 2000);

      // Clear previous calls
      mockGeminiClient.sendVideoFrame.mockClear();

      // Send video frame
      videoClient.send(JSON.stringify({
        type: 'realtime_input',
        media: {
          data: 'anBlZy1mcmFtZS1kYXRh', // base64: "jpeg-frame-data"
          mimeType: 'image/jpeg',
        },
        sessionId: 'video-test-session',
        timestamp: Date.now(),
      }));

      // Verify video frame was sent to Gemini
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(mockGeminiClient.sendVideoFrame).toHaveBeenCalledWith('anBlZy1mcmFtZS1kYXRh');
    } finally {
      // Cleanup
      if (videoClient.readyState === WebSocket.OPEN) {
        videoClient.close();
      }
    }
  }, 10000);

  /**
   * Smoke test: Interruption handling
   */
  it('should handle interruption signals from Gemini', async () => {
    const interruptClient = new WebSocket(`ws://localhost:${TEST_PORT}`);
    const receivedMessages: any[] = [];

    try {
      await new Promise<void>((resolve) => {
        interruptClient.on('open', () => {
          resolve();
        });
      });

      interruptClient.on('message', (data) => {
        receivedMessages.push(JSON.parse(data.toString()));
      });

      // Join and start session
      interruptClient.send(JSON.stringify({
        type: 'join_session',
        payload: { sessionId: 'interrupt-test-session', isCandidate: true },
        sessionId: 'interrupt-test-session',
        timestamp: Date.now(),
      }));

      await waitForMessage(receivedMessages, 'session_joined', 2000);

      interruptClient.send(JSON.stringify({
        type: 'start_session',
        payload: { config: {} },
        sessionId: 'interrupt-test-session',
        timestamp: Date.now(),
      }));

      await waitForMessage(receivedMessages, 'session_started', 2000);

      // Set active Gemini session
      (wsService as any).activeGeminiSessionId = 'interrupt-test-session';

      // Simulate interruption from Gemini
      mockGeminiClient.emit('message', {
        serverContent: {
          interrupted: true,
        },
      });

      // Wait for model_interruption event
      await waitForMessage(receivedMessages, 'model_interruption', 2000);

      const interruptMsg = receivedMessages.find(m => m.type === 'model_interruption');
      expect(interruptMsg).toBeDefined();
      expect(interruptMsg.payload.reason).toBe('user_speech');
    } finally {
      // Cleanup
      if (interruptClient.readyState === WebSocket.OPEN) {
        interruptClient.close();
      }
    }
  }, 10000);
});

/**
 * Helper function to wait for a specific message type
 */
function waitForMessage(
  messages: any[],
  type: string,
  timeoutMs: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (messages.some(m => m.type === type)) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        reject(new Error(`Timeout waiting for message type: ${type}`));
      }
    }, 50);
  });
}
